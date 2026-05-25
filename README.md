# Codeforces Anytime

Codeforces Anytime reads your Codeforces virtual contest history and plots a local rating graph in your browser.

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
