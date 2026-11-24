import Foundation
import CryptoKit
import CommonCrypto
import Security

enum FormBackupCrypto {
  private static let rounds: UInt32 = 600_000
  private static let format = "FORM-Encrypted-Backup-v1"
  private static func fail(_ message: String) -> NSError { NSError(domain: "FormBackup", code: 1, userInfo: [NSLocalizedDescriptionKey: message]) }
  private static func key(_ password: String, _ salt: Data) throws -> SymmetricKey {
    let pass = Array(password.utf8), saltBytes = Array(salt)
    guard pass.count >= 1, pass.count <= 1024, salt.count == 16 else { throw fail("Ungültiges Passwort oder Salz.") }
    var bytes = [UInt8](repeating: 0, count: 32)
    let status = pass.withUnsafeBytes { p in saltBytes.withUnsafeBytes { s in bytes.withUnsafeMutableBytes { b in
      CCKeyDerivationPBKDF(CCPBKDFAlgorithm(kCCPBKDF2), p.baseAddress!.assumingMemoryBound(to: Int8.self), pass.count, s.baseAddress!.assumingMemoryBound(to: UInt8.self), saltBytes.count, CCPseudoRandomAlgorithm(kCCPRFHmacAlgSHA256), rounds, b.baseAddress!.assumingMemoryBound(to: UInt8.self), 32)
    } } }
    guard status == kCCSuccess else { throw fail("Schlüsselableitung fehlgeschlagen.") }
    defer { bytes.withUnsafeMutableBytes { $0.initializeMemory(as: UInt8.self, repeating: 0) } }
    return SymmetricKey(data: bytes)
  }
  static func seal(_ text: String, _ password: String) throws -> String {
    guard text.utf8.count <= 15_000_000, password.count >= 12 else { throw fail("Backup zu groß oder Passwort kürzer als 12 Zeichen.") }
    var salt = Data(count: 16)
    let result = salt.withUnsafeMutableBytes { SecRandomCopyBytes(kSecRandomDefault, 16, $0.baseAddress!) }
    guard result == errSecSuccess else { throw fail("Zufallsquelle nicht verfügbar.") }
    let encrypted = try AES.GCM.seal(Data(text.utf8), using: key(password, salt), authenticating: Data(format.utf8))
    guard let box = encrypted.combined else { throw fail("Verschlüsselung fehlgeschlagen.") }
    let json = try JSONSerialization.data(withJSONObject: ["format": format, "salt": salt.base64EncodedString(), "box": box.base64EncodedString()])
    return String(decoding: json, as: UTF8.self)
  }
  static func open(_ text: String, _ password: String) throws -> String {
    guard text.utf8.count <= 21_000_000, let json = try JSONSerialization.jsonObject(with: Data(text.utf8)) as? [String: Any], json["format"] as? String == format, let salt64 = json["salt"] as? String, let box64 = json["box"] as? String, let salt = Data(base64Encoded: salt64), salt.count == 16, let combined = Data(base64Encoded: box64), combined.count >= 28, combined.count <= 15_000_028 else { throw fail("Verschlüsseltes Backup ungültig.") }
    do { let plain = try AES.GCM.open(AES.GCM.SealedBox(combined: combined), using: key(password, salt), authenticating: Data(format.utf8)); guard let result = String(data: plain, encoding: .utf8) else { throw fail("Ungültiger Text.") }; return result } catch { throw fail("Falsches Passwort oder beschädigtes Backup.") }
  }
}
