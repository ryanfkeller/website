const { execSync } = require('child_process');

class GitHubHelper {
    constructor(repoOwner, repoName) {
        this.repo = `${repoOwner}/${repoName}`;
        this.createdIssues = []; // Keep track of the issues created by this obj
        this.createdLabels = []; // Keep track of the labels created by this obj

        this.createTestProject();
    }

    // Execute gh CLI command
    exec(command, options = {}) {
        try {
            const result = execSync(`gh ${command}`, {
                encoding: 'utf8',
                stdio: 'pipe', 
                ...options
            });
            return result.trim();
        } catch (error) {
            throw new Error(`GitHub CLI failed: ${command}\n${error.message}`);
        }
    }

    // Execute and parse JSON response
    execJson(command) {
        const result = this.exec(command);
        return JSON.parse(result);
    }

    /***********************************
     * Project Operations
     ***********************************/
    createTestProject(projName = TEST_CONFIG.TEST_PROJ) {
        const currentProjects = this.execJson(`project list --format json`);

        // Extract projects array from result
        const projArray = currentProjects.projects || [];
        const existing_test_proj = projArray.find(p=> p.title === projName);
        if (existing_test_proj) {
            console.log(`Project ${projName} already exists! Skipping generation`)
            return;
        }


        console.log(`Test project ${projName} not found. Creating it now...`);
        this.exec(`project create --owner "${TEST_CONFIG.REPO_OWNER}" --title "${projName}"`);

        console.log(`New project ${projName} created!`);
    }

    /***********************************
     * Issue Operations
     ***********************************/

    // Create a new issue with optional labels
    createIssue(title, body = '', labels = [], proj = TEST_CONFIG.TEST_PROJ) {
        const labelFlag = labels.length > 0 ? `--label "${labels.join(',')}"` : '';
        const projFlag = proj ? `--project "${TEST_CONFIG.TEST_PROJ}"` : '';
        const url = this.exec(`issue create --repo ${this.repo} --title "${title}" --body "${body}" ${labelFlag} ${projFlag}`);

        const issueNumber = url.split('/').pop();
        this.createdIssues.push(issueNumber);
        return issueNumber;
    }

    // Get information from an existing issue
    getIssue(issueNumber, fields = ['number', 'title', 'state', 'labels']) {
        return this.execJson(`issue view ${issueNumber} --repo ${this.repo} --json ${fields.join(',')}`);
    }

    // Add a new label to an existing issue
    addLabelsToIssue(issueNumber, labels) {
        return this.exec(`issue edit ${issueNumber} --repo ${this.repo} --add-label "${labels.join(',')}"`);
    }

    // Close an existing issue
    closeIssue(issueNumber, message = 'Automated issue closure') {
        this.exec(`issue close ${issueNumber} --repo ${this.repo} --comment "${message}"`);
        // Remove from tracking since it was closed
        this.createdIssues = this.createdIssues.filter(issue => issue != issueNumber);
    }

    // Delete an existing issue
    deleteIssue(issueNumber) {
        this.exec(`issue delete "${issueNumber}" --repo ${this.repo} --yes`);
        // Remove from tracking since it was deleted
        this.createdIssues = this.createdIssues.filter(issue => issue != issueNumber);
    }

    /***********************************
     * Label Operations
     ***********************************/
    createLabel(name, color = 'f29513', description = '') {
        const descFlag = description ? `--description "${description}"` : '';
        this.exec(`label create "${name}" --repo ${this.repo} --color ${color} ${descFlag}`);
        this.createdLabels.push(name);
        return name;
    }

    deleteLabel(name) {
        this.exec(`label delete "${name}" --repo ${this.repo} --yes`);
        // Remove from tracking since it was deleted
        this.createdLabels = this.createdLabels.filter(label => label != name);
    }

    listLabels() {
        return this.execJson(`label list --repo ${this.repo} --json name,color,description`);
    }

    /***********************************
     * Workflow Operations
     ***********************************/
    runWorkflow(name, branch = null) {
    // If no branch specified, use the current branch
        const targetBranch = branch || execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        return this.exec(`workflow run ${name} --repo ${this.repo} --ref ${targetBranch}`);
     }

    /***********************************
     * Test Cleanup
     ***********************************/

    async cleanup() {
        // Close and clean up created issues
        // Note: We don't delete by default because that destroys logs
        for (const issueNumber of this.createdIssues) {
            try {
                this.closeIssue(issueNumber, "Test cleanup");
            } catch (error) {
                console.warn(`Failed to close issue ${issueNumber}: ${error.message}`);
            }
        }

        // Delete created labels
        for (const labelName of this.createdLabels) {
            try {
                this.deleteLabel(labelName);
            } catch (error) {
                console.warn(`Failed to delete label ${labelName}: ${error.message}`);
            }
        }
    }
}

module.exports = GitHubHelper;