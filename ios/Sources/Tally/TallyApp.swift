import SwiftUI

@main
struct TallyApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }
}

private struct RootView: View {
    private let webRoot = Bundle.module.url(forResource: "Web", withExtension: nil)

    var body: some View {
        if let webRoot, FileManager.default.fileExists(atPath: webRoot.appendingPathComponent("index.html").path) {
            WebAppView(webRoot: webRoot)
                .ignoresSafeArea()
                .background(Color.appBackground.ignoresSafeArea())
        } else {
            VStack(spacing: 12) {
                Text("Web build missing")
                    .font(.headline)
                Text("Run `npm run ios:web` in the project folder, then build the app again.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(32)
        }
    }
}

extension Color {
    /// Matches the web app's page background, so there's no white flash while it loads.
    static let appBackground = Color(UIColor { traits in
        traits.userInterfaceStyle == .dark
            ? UIColor(red: 13 / 255, green: 14 / 255, blue: 17 / 255, alpha: 1)
            : UIColor(red: 244 / 255, green: 244 / 255, blue: 239 / 255, alpha: 1)
    })
}
