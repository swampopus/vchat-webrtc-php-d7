# vchat-webrtc-php-d7
vchat-webrtc-php-d7

See: https://peacocksoftware.com/blog/webrtc-video-chat-only-php-and-javascript-no-nodejs-or-websockets for full explanation.


View the .module file for the PHP code.

Based heavily on the code from https://github.com/nielsbaloe/webrtc-php.


This is technically a Drupal 7 module, but you can use it as a starting point for any PHP project.  Notice the db_query() commands.  Replace those with direct pdo or mysqli or whatever database engine you elect to use.

For those not familiar with Drupal 7, the _menu() function lists the available URLs, and the "callback" functions are what get run when that URL is accessed.  As you can see in the .module file, it's fairly simple and is mostly about handling the database and responding to AJAX requests.  All of the real logic takes place in the javascript file.  As jQuery ships with Drupal 7, I do use jQuery in the javascript, but you can easily change it to use vanilla js with no other libraries needed.

In this demonstration, an action happens every 5 seconds.  In a production project, you'd want to make that faster, and then stop checking for actions while connected.

As this is just meant for demo code, please do not leave any issues asking for help implementing it; I will not be able to answer.
That said, my business, https://peacocksoftware.com, is available for paid support and custom programming.  Feel free to visit the "Contact" page for more information.