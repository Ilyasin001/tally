// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "Tally",
    platforms: [
        .iOS(.v17),
    ],
    products: [
        // xtool packages this library as the app.
        .library(
            name: "Tally",
            targets: ["Tally"]
        ),
    ],
    targets: [
        .target(
            name: "Tally",
            // The web build from `npm run ios:web`, served to the web view from the app bundle.
            resources: [
                .copy("Web"),
            ]
        ),
    ],
    swiftLanguageModes: [.v5]
)
