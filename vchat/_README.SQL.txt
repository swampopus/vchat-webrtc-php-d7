Using whatever SQL engine you like (I used MySQL/MariaDB), first create a table like so:

CREATE TABLE `vchat` (
  `vcid` int unsigned NOT NULL AUTO_INCREMENT,
  `uid` int DEFAULT NULL,
  `chat_room_id` varchar(255) DEFAULT NULL,
  `package_event` varchar(255) DEFAULT NULL,
  `message` text,
  `processed` tinyint DEFAULT '0',
  `posted` datetime DEFAULT NULL,
  PRIMARY KEY (`vcid`)
)


