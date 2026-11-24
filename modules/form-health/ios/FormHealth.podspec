Pod::Spec.new do |s|
  s.name = 'FormHealth'
  s.version = '1.0.0'
  s.summary = 'Optional read-only HealthKit bridge for FORM'
  s.description = 'Reads user-authorized daily HealthKit summaries on device.'
  s.license = { :type => 'MIT' }
  s.author = { 'FORM' => 'local@invalid.example' }
  s.homepage = 'https://docs.expo.dev/modules/overview/'
  s.platforms = { :ios => '16.4' }
  s.source = { :git => 'https://github.com/expo/expo.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'HealthKit'
  s.source_files = '**/*.{h,m,mm,swift}'
  s.swift_version = '5.9'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
