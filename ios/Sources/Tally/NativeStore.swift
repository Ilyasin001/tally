import Foundation

/// Keeps the app's data in a JSON file in Application Support, so it survives even if
/// iOS clears the web view's storage. The page reads it at launch from
/// `window.__TALLY_NATIVE__` and saves back through the "tally" message handler.
enum NativeStore {
    private static var fileURL: URL {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir.appendingPathComponent("tally-state.json")
    }

    static func save(_ json: String) {
        try? Data(json.utf8).write(to: fileURL, options: .atomic)
    }

    /// Script injected before the page's own scripts run.
    static func bootstrapScript() -> String {
        var state = "null"
        if let data = try? Data(contentsOf: fileURL) {
            if (try? JSONSerialization.jsonObject(with: data)) != nil, let text = String(data: data, encoding: .utf8) {
                // JSON is valid JavaScript, so it can be embedded as a literal.
                state = text
            } else {
                // Set an unreadable file aside rather than overwriting it on the next save.
                let aside = fileURL.deletingPathExtension().appendingPathExtension("unreadable.json")
                try? FileManager.default.removeItem(at: aside)
                try? FileManager.default.moveItem(at: fileURL, to: aside)
            }
        }
        return "window.__TALLY_NATIVE__ = { state: \(state) };"
    }
}
