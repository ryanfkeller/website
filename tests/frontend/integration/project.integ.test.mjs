import { jest } from '@jest/globals';
import { createRequire } from 'module';
import { loadHTML } from '../utils/jekyll-html-loader.js';

import path from 'node:path';

const require = createRequire(import.meta.url);
const { setupJSDOMSpies, resetJSDOM, injectTimezoneShim } = require('../utils/test-helpers.js');

const samplePage = {
  identification: '1',
  title: 'HFLA Project A',
  'image-hero': '/assets/images/projects/311data-beta.png',
};

const sampleProjects = [
    "Mon Oct 20 2025 13:24:00 GMT+0000 (Coordinated Universal Time)",
    { id: 1, name: "HFLA Project A", 
        languages: ["Python", "TCL", "VHDL", "C++"],
        contributorsComplete: {
            data: [
                {
                    github_url: "https://github.com/ryanfkeller",
                    avatar_url: "https://avatars.githubusercontent.com/u/34756033?v=4",
                },
            ],
        }
    }
];

const sampleSchedule = [
  {
    name:      'Weekly Meeting',
    date:      '2025-10-20',
    startTime: '2025-10-20T17:00:00Z',
    endTime:   '2025-10-20T18:00:00Z',
    project:   { name: 'HFLA Project A' },
  }
];


beforeEach(async () => {
    jest.resetModules();

    // Mock decodeURIComponent to return test data rather than _data data
    // Use the call stack to make sure we provide the correct data to the correct file
    const decodeSpy = jest.spyOn(global, 'decodeURIComponent')
        .mockImplementation((encoded) => {
            const stack = new Error().stack;
            if (stack.includes('vrms-events.mjs')) {
                return JSON.stringify(sampleSchedule);
            } else if (stack.includes('project.mjs')) {
                return JSON.stringify(sampleProjects);
            }

            console.warn('decodeURIComponent called from unexpected location:', stack);
            return encoded;
        });
        

    // Load and render the HTML template with the test page data
    const layoutPath = path.resolve(import.meta.dirname, '../../../_layouts/project.html');
    const htmlContent = loadHTML(layoutPath, samplePage);

    // Initialize the JSDOM with the redered HTML
    resetJSDOM(htmlContent);

    // Add required global function for project.mjs
    injectTimezoneShim();

    // Import project module (executes against the DOM)
    await import('../../../assets/js/project.mjs');

    // Cleanup
    decodeSpy.mockRestore();
});

afterEach(() => {
});


it('appends a meeting list item from vrms data', () => {
    const item = document.querySelector('.meeting-times-list');
    expect(item).not.toBeNull();
    expect(item.textContent).toMatch(/Weekly Meeting/);
})



