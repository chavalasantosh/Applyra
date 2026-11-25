# Scheduled opportunity scans

Open Career Suite → Scheduled Opportunity Scans. Select daily, weekly or monthly; set the local time, weekday or day of month; choose target roles, locations and minimum keyword fit. Save the schedule and enable recurring scans, or use Scan now. Uncheck Enable recurring scans and save to pause.

Schedules and the last 12 scan results are isolated by candidate. They use the candidate’s recorded profile skills, not assumptions about experience. Results include source links, role/skill overlap, technical requirements and possible profile gaps. Up to five results are shown. Returned links are deduplicated for 90 days; dated listings older than 45 days are excluded. An empty profile produces no matches. A remote listing does not automatically mean eligibility from every country.

The extension uses Chrome alarms, reconstructs the alarm on worker startup, catches up once after browser restart and schedules the next future occurrence. Weekly means the selected weekday. Monthly days 29–31 clamp to the month’s last day and restore the requested day the next month. Time follows the computer’s local timezone. Chrome must be running; exact delivery can be delayed by sleep or browser scheduling. For continuous delivery while Chrome is closed, add a hosted scheduler separately.

Sources: Remotive remote-jobs API and the first page of Arbeitnow’s public job board API. This provides limited feed coverage, especially for India-based on-site roles. Source names and actual listing links remain visible. No exhaustive web search, LLM assessment, email delivery, or automated applications are claimed. Partial and total feed failures are displayed and do not erase older results. Notifications open Career Suite.

## Installation
Extract this project, then reload the existing unpacked extension from chrome://extensions (or Load unpacked for a new installation). Keep using the same extension folder/identity to retain local data. No new Chrome permissions are required.

## Implementation and verification
The existing shipped background.js remains intact. background-scheduled.js imports it and adds the standalone opportunity core and worker. UI is added to career-suite.html. Source modules are in src; runtime copies live in assets/opportunities and are refreshed by the existing build script. The production packaging script includes assets and the wrapper.

Run: node tests/opportunity-scans.test.cjs
Five tests cover daily/weekly/monthly dates, validation, ranking and safe links, duplication, worker save/run/pause, failure reporting and restart catch-up using mocked Chrome and feeds. Syntax checks pass. Real Chrome UI/alarms and live external feed availability were not integration-tested in this environment.
