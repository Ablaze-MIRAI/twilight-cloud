package user.license_check

allowed_licenses := {
    "MIT",
    "Apache-2.0",
    "BSD-3-Clause",
    "ISC"
}

allowed_packages := {
    # LGPLだがサーバーサイドでの動作なので許容する
    "@img/sharp-libvips-linux-x64",
    "@img/sharp-libvips-linuxmusl1-x64"
}

deny contains msg if {
    license := input.Results[_].Licenses[_]
    
    license.Severity != "LOW"
    not allowed_licenses[license.Name]
    not allowed_packages[license.PkgName]

    msg := sprintf("NOT ALLOWED LICENSE: '%s' (package: %s)", [license.Name, license.PkgName])
}