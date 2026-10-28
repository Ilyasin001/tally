import SwiftUI
import UIKit
import WebKit

/// Hosts the bundled web app full screen and bridges the few things a web view
/// can't do on its own: saving data natively, sharing a backup file, and JS dialogs.
struct WebAppView: UIViewRepresentable {
    let webRoot: URL

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let content = WKUserContentController()
        content.addUserScript(WKUserScript(source: NativeStore.bootstrapScript(), injectionTime: .atDocumentStart, forMainFrameOnly: true))
        content.add(context.coordinator, name: "tally")

        let config = WKWebViewConfiguration()
        config.userContentController = content
        config.websiteDataStore = .default()
        config.setURLSchemeHandler(BundleSchemeHandler(root: webRoot), forURLScheme: BundleSchemeHandler.scheme)

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        // Let the page handle safe areas itself via env(safe-area-inset-*).
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        #if DEBUG
        webView.isInspectable = true
        #endif

        context.coordinator.webView = webView
        webView.load(URLRequest(url: BundleSchemeHandler.startURL))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKScriptMessageHandler, WKNavigationDelegate, WKUIDelegate {
        weak var webView: WKWebView?

        // MARK: Messages from the page

        func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
            guard let body = message.body as? [String: Any], let type = body["type"] as? String else { return }
            switch type {
            case "save":
                if let data = body["data"] as? String { NativeStore.save(data) }
            case "export":
                if let data = body["data"] as? String {
                    share(data, filename: body["filename"] as? String ?? "tally-backup.json")
                }
            default:
                break
            }
        }

        private func share(_ json: String, filename: String) {
            let url = FileManager.default.temporaryDirectory.appendingPathComponent(filename)
            guard (try? json.write(to: url, atomically: true, encoding: .utf8)) != nil else { return }
            let sheet = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            if let popover = sheet.popoverPresentationController, let webView {
                popover.sourceView = webView
                popover.sourceRect = CGRect(x: webView.bounds.midX, y: webView.bounds.midY, width: 0, height: 0)
                popover.permittedArrowDirections = []
            }
            topViewController()?.present(sheet, animated: true)
        }

        // MARK: Navigation

        /// Keep the app on its own scheme; open anything else in Safari.
        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { return decisionHandler(.cancel) }
            if [BundleSchemeHandler.scheme, "about", "blob", "data"].contains(url.scheme ?? "") {
                decisionHandler(.allow)
            } else {
                if action.navigationType == .linkActivated { UIApplication.shared.open(url) }
                decisionHandler(.cancel)
            }
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            webView.reload()
        }

        // MARK: alert() and confirm()

        func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler() })
            present(alert, orElse: completionHandler)
        }

        func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
            let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in completionHandler(false) })
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) })
            present(alert) { completionHandler(false) }
        }

        private func present(_ controller: UIViewController, orElse fallback: () -> Void) {
            if let top = topViewController() {
                top.present(controller, animated: true)
            } else {
                fallback()
            }
        }

        private func topViewController() -> UIViewController? {
            var top = webView?.window?.rootViewController
            while let next = top?.presentedViewController { top = next }
            return top
        }
    }
}
