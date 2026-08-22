CREATE TABLE `dose_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`medicineId` int NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`status` enum('due','taken','missed','upcoming') NOT NULL DEFAULT 'upcoming',
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dose_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`dose` varchar(120) NOT NULL,
	`form` varchar(80) NOT NULL,
	`instructions` text NOT NULL,
	`scheduleLabel` varchar(120) NOT NULL,
	`scheduleTimes` text NOT NULL,
	`refillDate` timestamp,
	`remainingDoses` int NOT NULL DEFAULT 0,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reminder_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`medicineId` int,
	`kind` enum('dose','refill') NOT NULL,
	`leadMinutes` int NOT NULL DEFAULT 30,
	`emailEnabled` int NOT NULL DEFAULT 0,
	`schedule_cron_task_uid` varchar(65),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reminder_configs_id` PRIMARY KEY(`id`)
);
