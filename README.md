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

> [!NOTE]
> Codeforces no longer exposes unofficial or virtual standings for regular contests through the public API, so the app cannot read the exact virtual rank that Codeforces calculated at the time of your participation.
> It estimates your virtual rank from currently available public standings and your submission history, so rank, performance, and local rating changes may differ slightly from older Codeforces Anytime records or from values shown by Codeforces at the time.

## Credits

This project is based on [codeforces-anytime](https://github.com/sono8stream/codeforces-anytime) by sono8stream.
