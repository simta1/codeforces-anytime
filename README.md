# Codeforces Anytime
Codeforces Anytime reads your Codeforces virtual contest history and plots a local rating graph in your browser.

## Usage
1. Open https://simta1.github.io/codeforces-anytime/#/ in your browser.
2. Click `Add handle`.
3. Enter your Codeforces handle.
4. Open your profile page.
5. Wait for the app to load and calculate your virtual contest records.

> [!NOTE]
> The first calculation may take a while. Later visits reuse saved local data and only add newly detected virtual contests.
> You can save multiple handles in the same browser and switch between them from the start page.

## Rating Calculation
- If virtual contest history exists, the initial local rating is your official Codeforces rating just before your first virtual contest.
- If no virtual contest history exists, the local rating starts at 1500.
- For each virtual contest, the app reconstructs your virtual rank by comparing public official standings with your user.status submissions, then applies the existing rating calculation logic.
- Only contests shown on the [Supported contests](https://simta1.github.io/codeforces-anytime/#/contests) page are used for rating updates.