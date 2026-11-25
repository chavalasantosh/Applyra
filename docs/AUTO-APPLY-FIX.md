# Auto Apply patch — 2.8.0.11

## Confirmed defects corrected
- Three branches computed a boolean named explicitInCard and tried to click it instead of the actual DOM element. They returned clicked:true even when no click occurred. These now use the real Apply element.
- A title/heading/card fallback was incorrectly classified as an Apply button. Navigation-only cards now open their supported Naukri job detail URL. Missing controls and missing links fail explicitly.
- The job-detail click latch survived navigation between jobs in a single-page application. It is now scoped to the job pathname, preventing one job from blocking the next.
- The click latch was set before a native click succeeded, preventing recovery from a thrown click. It is now set after the click.
- Broad success-toast matching accepted negative messages such as "Application not submitted". Explicit failure phrases are rejected, and success requires an application-specific phrase.
- Hidden detail-page controls and screening drawers now use computed visibility and layout checks.

The same corrected bridge is included in src/injected-bridges.js, injected-bridges.js, and the deployed background.js bridge section. Existing bundled background logic and the new scheduled opportunity feature are retained. No permission, entitlement, CAPTCHA, or screening-question bypass was added.

## Validation
node tests/auto-apply-bridge.test.cjs
node tests/opportunity-scans.test.cjs

10 Auto Apply simulated-DOM regression tests pass. Running the same suite on the original bridge reproduces 8 failures. The existing bulk-checkbox path remains covered. All 5 opportunity scheduling tests also pass. Syntax checks pass for the modified bridge and background bundle.

Live Chrome/Naukri end-to-end verification remains outstanding: a headless browser download failed in this environment. No real job applications were submitted. This patch addresses confirmed source defects, but cannot confirm that they are the exact failure observed on your current Naukri page.

## Update and try again
1. Extract this ZIP and replace the contents of your existing unpacked-extension folder, preserving its folder location.
2. Open chrome://extensions and click Reload for Applyra. Confirm version 2.8.0.11. For Brave use brave://extensions.
3. Refresh the open Applyra and Naukri tabs so they load the updated code.
4. If an earlier run is still pending, use Stop run first. Preview one eligible job, then start a run with batch size 1.
5. If it still stops, capture the exact Auto Apply error and activity entry, plus whether this is Recommended Jobs or Search + auto apply. Screening questions, login and security checks still require the user when applicable.
