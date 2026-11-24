#!/usr/bin/env bash
# Actual Apple-framework compile and bidirectional Node / Swift compatibility checks.
set -euo pipefail
cd "$(dirname "$0")/.."
[[ "$(uname -s)" == Darwin ]] || { echo 'Apple CryptoKit/CommonCrypto runtime test requires macOS.' >&2; exit 2; }
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
node - "$tmp" <<'JS'
const fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const dir=process.argv[2],format='FORM-Encrypted-Backup-v1',pass='FORM test password 🔒',text='{"fixture":"äöü 🔒"}';
const salt=crypto.randomBytes(16),nonce=crypto.randomBytes(12),key=crypto.pbkdf2Sync(pass,salt,600000,32,'sha256'),cipher=crypto.createCipheriv('aes-256-gcm',key,nonce);cipher.setAAD(Buffer.from(format));const ciphertext=Buffer.concat([cipher.update(text,'utf8'),cipher.final()]);fs.writeFileSync(path.join(dir,'node.json'),JSON.stringify({format,salt:salt.toString('base64'),box:Buffer.concat([nonce,ciphertext,cipher.getAuthTag()]).toString('base64')}));
JS
cat > "$tmp/main.swift" <<'SWIFT'
import Foundation
let dir = URL(fileURLWithPath: CommandLine.arguments[1])
let pass = "FORM test password 🔒", text = "{\"fixture\":\"äöü 🔒\"}"
let incoming = try String(contentsOf: dir.appendingPathComponent("node.json"), encoding: .utf8)
let decrypted = try FormBackupCrypto.open(incoming, pass)
precondition(decrypted == text)
let encrypted = try FormBackupCrypto.seal(text, pass)
let reopened = try FormBackupCrypto.open(encrypted, pass)
precondition(reopened == text)
let second = try FormBackupCrypto.seal(text, pass)
precondition(encrypted != second)
do { _ = try FormBackupCrypto.open(encrypted, "wrong password"); fatalError("wrong password accepted") } catch {}
var tampered = try JSONSerialization.jsonObject(with: Data(encrypted.utf8)) as! [String: Any]
var box = Data(base64Encoded: tampered["box"] as! String)!
box[12] ^= 1
tampered["box"] = box.base64EncodedString()
let altered = String(decoding: try JSONSerialization.data(withJSONObject: tampered), as: UTF8.self)
do { _ = try FormBackupCrypto.open(altered, pass); fatalError("tampered backup accepted") } catch {}
try encrypted.write(to: dir.appendingPathComponent("swift.json"), atomically: true, encoding: .utf8)
print("PASS: Apple crypto roundtrip, random salt/nonce, wrong password, tampering, Node -> Swift.")
SWIFT
swiftc modules/form-health/ios/FormBackupCrypto.swift "$tmp/main.swift" -o "$tmp/form-crypto"
"$tmp/form-crypto" "$tmp"
node - "$tmp" <<'JS'
const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict'),path=require('node:path');const j=JSON.parse(fs.readFileSync(path.join(process.argv[2],'swift.json')));assert.equal(j.format,'FORM-Encrypted-Backup-v1');const box=Buffer.from(j.box,'base64'),key=crypto.pbkdf2Sync('FORM test password 🔒',Buffer.from(j.salt,'base64'),600000,32,'sha256'),dec=crypto.createDecipheriv('aes-256-gcm',key,box.subarray(0,12));dec.setAAD(Buffer.from(j.format));dec.setAuthTag(box.subarray(-16));assert.equal(Buffer.concat([dec.update(box.subarray(12,-16)),dec.final()]).toString(),' {"fixture":"äöü 🔒"}'.trim());console.log('PASS: Swift -> Node.');
JS
