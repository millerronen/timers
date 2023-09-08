Atomic Timer Creation: When a new timer is created, we want to ensure that both the timer's data insertion into the database and the scheduling of the timer are atomic operations. If one of these operations fails, the other should not proceed. Using a database transaction can help us achieve this atomicity - This is one of the reasons that I have decided to use this kind of db.

I decided to have a retention policy of 30 days - this retention policy ensures that timers are automatically removed from the system once they become older than the retention period.
Limiting the scheduling of timers to no more than 30 days into the future is an assumption, especially if I have a retention policy of 30 days.
By making this assumption, I am simplifying my application logic and database maintenance.
It also helps prevent potential issues with excessive resource usage.
