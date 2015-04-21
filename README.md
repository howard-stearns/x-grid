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

# Approach

Because mobile doesn't implement the standard (e.g., HTML5) drag-and-drop, I interpret this as as puzzle of how to implement draggable, multi-user interaction-state from first principles, staying DRY and elegent. 

However, there's a cultural issue in the spec, with the use of fragment identifiers for size:
* Some developers consider the part of a url to identify the resource, and the fragment identifier (the #4, above) to identify just a view onto the resource. This is consistent with the views of W3c (e.g. http://www.w3.org/DesignIssues/Fragment.html) and with how Google crawls websites (e.g., https://developers.google.com/webmasters/ajax-crawling/docs/getting-started).
* Others use different fragment identifiers to identify different resources (e.g., angularjs).
My own view is that the latter is wrong, resulting in, e.g., an inability to be crawled properly. The proper technique for having a parameterized resource is to use query parameters. Since the spec here uses fragments with no path or query, I'm interpreting the "game" or "board" to be designated entirely by the domain. This greatly simplifies the problem, such that each domain is a different board, and there is no checking for different sizes by different users at the same domain. This is consistent with the idea that the task is to focus on the first-principle multi-user interaction state. If you want to see multiple boards within a server, or coordination of game size between players, then lets discuss a different url format.


## Files and Operation

The operation of the above is self contained in x-grid.js.

x-grid.html can be used directly in a browser. It's fully functional, but of course, not multi-user.

The multi-user capability is provided by a very tiny nodejs server in app.js. Just run `node app`. No other libraries are needed. 

It's against my religion to not include a test suite, but I'm not about to try to define an in-browser test suite for a multi-user asynchronous app without a third-party library (like jasmine, for example).