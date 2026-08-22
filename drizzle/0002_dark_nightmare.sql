CREATE TABLE `favorite_pharmacies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`externalId` varchar(160) NOT NULL,
	`name` varchar(160) NOT NULL,
	`address` varchar(240) NOT NULL,
	`latitude` varchar(32) NOT NULL,
	`longitude` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorite_pharmacies_id` PRIMARY KEY(`id`)
);
