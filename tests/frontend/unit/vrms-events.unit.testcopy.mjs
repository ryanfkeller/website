import path from 'path';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

import {jekyllImport} from '../utils/jekyll-import.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const testVrmsData = [
    { name: 'Regular Meeting', date: '2025-10-21', startTime: '2025-10-21T18:00:00Z', endTime: '2025-10-21T19:00:00Z', project: { name: 'Project A' } },
    { name: 'Another Meeting', date: '2025-10-20', startTime: '2025-10-20T17:00:00Z', endTime: '2025-10-20T18:00:00Z', project: { name: 'Project B' } },
    { name: 'Test Event', date: '2025-10-22', startTime: '2025-10-22T12:00:00Z', endTime: '2025-10-22T13:00:00Z', project: { name: 'Project C' } },
    { name: 'testing event', date: '2025-10-23', startTime: '2025-10-23T13:00:00Z', endTime: '2025-10-23T14:00:00Z', project: { name: 'Project D' } },
    { name: 'Early Meeting', date: '2025-10-20', startTime: '2025-10-20T08:00:00Z', endTime: '2025-10-20T09:00:00Z', project: { name: 'Project B' } },
    { name: 'Late Meeting', date: '2025-10-20', startTime: '2025-10-20T23:00:00Z', endTime: '2025-10-20T23:59:00Z', project: { name: 'Project B' } }
];
const context = ({
    site: {
        data: {
            external: {
                    vrms_data: testVrmsData
            }
        }
    }
});

const vrmsEventsPath = path.resolve(__dirname, '../../../assets/js/utility/vrms-events.mjs');

const vrmsModule = await jekyllImport(vrmsEventsPath, context);



beforeAll(async () => {
    
});

beforeEach(async () => {
    jest.resetModules();
});


describe('vrmsModule.vrmsDataFetch', () => {
    it('should return sorted non-test events and not call appendMeetingTimes for "events" view', async() => {
        // Create a mock function just to see if it is called
        const mockAppend = jest.fn();

        // Call vrmsModule.vrmsDataFetch with events view and mock function
        const sorted = vrmsModule.vrmsDataFetch('events', mockAppend);

        // Mock append should not be called
        expect(mockAppend).not.toHaveBeenCalled();

        // "Test Event" and "testing event" should be filtered out
        expect(sorted.every(e => /test/i.test(e.name) === false)).toBe(true);

        // Earliest date should be 2025-10-20
        expect(sorted[0].date).toBe('2025-10-20');

        // Same-day ordering should be correct (08:00 before 17:00 before 23:00)
        const sameDay = sorted.filter(s => s.date === '2025-10-20');
        expect(sameDay.length).toBe(3);
        expect(new Date(sameDay[0].startTime) < new Date(sameDay[1].startTime)).toBe(true);
        expect(new Date(sameDay[1].startTime) < new Date(sameDay[2].startTime)).toBe(true);
    });

    it('should call appendMeetingTimes with sorted non-test events for "project" view', async() => {
        // Create a mock function to see if its called and what it was called with
        const mockAppend = jest.fn();
        
        // Call vrmsModule.vrmsDataFetch with events view and mock function
        const sorted = vrmsModule.vrmsDataFetch('project', mockAppend);

        // Mock event should be called
        expect(mockAppend).toHaveBeenCalled();

        // Check the calling args -- should have been called with our sorted events list
        const calledWith = mockAppend.mock.calls[0][0];
        expect(Array.isArray(calledWith)).toBe(true);
        expect(calledWith.every(e => /test/i.test(e.name) === false)).toBe(true);

        // The actual return value from vrmsModule.vrmsDataFetch should be undefined because nothing is returned
        expect(sorted).toBeUndefined();
    });
});

describe('localeTimeIn12Format', () => {
    it('should return a 12-hour formatted string', () => {
        // Pass in a dummy timestamp checking single digit AM hour format
        let timeStr = vrmsModule.localeTimeIn12Format("2020-05-13T02:00:00.000Z");
        expect (typeof timeStr).toBe('string');
        // regex to match "1:00 am"/"10:00 pm" format.
        // Maybe overkill and not as specific as later tests...
        expect(timeStr).toMatch(/\b([1-9]|1[1-2])\b:\b([0-5][0-9])\b (am|pm)/); 
    })

    it ('should handle single digit AM times correctly', () => {
        const timeStr = vrmsModule.localeTimeIn12Format("2025-10-20T01:00:00.000Z");
        expect(timeStr).toBe('1:00 am');
    })

    it ('should handle multi-digit AM times correctly', () => {
        const timeStr = vrmsModule.localeTimeIn12Format("2025-10-20T10:15:00.000Z");
        expect(timeStr).toBe('10:15 am');
    })

    it ('should handle single-digit PM times correctly', () => {
        const timeStr = vrmsModule.localeTimeIn12Format("2025-10-20T14:31:00.000Z");
        expect(timeStr).toBe('2:31 pm');
    })

    it ('should handle multi-digit PM times correctly', () => {
        const timeStr = vrmsModule.localeTimeIn12Format("2025-10-20T23:59:00.000Z");
        expect(timeStr).toBe('11:59 pm');
    })
});
