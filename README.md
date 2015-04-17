# x-grid

This is job-application coding exercise, specified as follows:

"Requirements:
* Compataibility on mobile browsers is expected
* No third-party JavaScript libraries
* No need to make the UI pretty (e.g., no bootstrap)
1. Given a number suffixed in a url, make a grid of size n, and render it in HTML. No restrictions on the URL format. E.g. http://127.0.0.1/#4 produces a 4x4 grid.
2. Tapping on an empty grid square adds an 'x' to it. Tapping once more removes the 'x'.
3. Make x's draggable from their grid square to any other grid squares within the grid. If an x is drag-and-dropped to a grid square already containing an x, the drag-and-rop action is cancelled.
4. Make the positions of all 'x's sync in other browsers/tabs with the same URL from Step 1. No restrictions on the backend paltform."

Because mobile doesn't implement the standard (e.g., HTML5) drag-and-drop, I interpret this as as puzzle of how to implement draggable, multi-user interaction-state from first principles, staying DRY and elegent.

It's against my religion to not include a test suite, but I'm not about to try to define an in-browser test suite for a multi-user asynchronous app without a third-party library (like jasmine, for example).