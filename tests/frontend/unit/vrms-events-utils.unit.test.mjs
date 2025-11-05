import {sortEventsByDate, filterTestEvents} from "../../../assets/js/utility/vrms-events-utils.mjs";

const testEvents = [
    { name: 'Regular Meeting', date: '2025-10-21', startTime: '2025-10-21T18:00:00Z', endTime: '2025-10-21T19:00:00Z', project: { name: 'Project A' } },
    { name: 'Another Meeting', date: '2025-10-20', startTime: '2025-10-20T17:00:00Z', endTime: '2025-10-20T18:00:00Z', project: { name: 'Project B' } },
    { name: 'Test Event', date: '2025-10-22', startTime: '2025-10-22T12:00:00Z', endTime: '2025-10-22T13:00:00Z', project: { name: 'Project C' } },
    { name: 'testing event', date: '2025-10-23', startTime: '2025-10-23T13:00:00Z', endTime: '2025-10-23T14:00:00Z', project: { name: 'Project D' } },
    { name: 'Early Meeting', date: '2025-10-20', startTime: '2025-10-20T08:00:00Z', endTime: '2025-10-20T09:00:00Z', project: { name: 'Project B' } },
    { name: 'Late Meeting', date: '2025-10-20', startTime: '2025-10-20T23:00:00Z', endTime: '2025-10-20T23:59:00Z', project: { name: 'Project B' } }
];

it('sortEventsByDate should return sorted events', async() => {

    // Call sortEventsByDate with testEvents
    const sorted = sortEventsByDate(testEvents);

    // Earliest date should be 2025-10-20
    expect(sorted[0].date).toBe('2025-10-20');

    // Same-day ordering should be correct (08:00 before 17:00 before 23:00)
    const sameDay = sorted.filter(s => s.date === '2025-10-20');
    expect(sameDay.length).toBe(3);
    expect(new Date(sameDay[0].startTime) < new Date(sameDay[1].startTime)).toBe(true);
    expect(new Date(sameDay[1].startTime) < new Date(sameDay[2].startTime)).toBe(true);

    // "Test Event" and "testing event" should be filtered out
    // expect(sorted.every(e => /test/i.test(e.name) === false)).toBe(true);
});


it('filterTestEvents should filter out test events', async() => {

    // Call sortEventsByDate with testEvents
    const filtered = filterTestEvents(testEvents);

    // "Test Event" and "testing event" should be filtered out
    expect(filtered.every(e => /test/i.test(e.name) === false)).toBe(true);
});

