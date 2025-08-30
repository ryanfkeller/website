async function createUnlabelNotificationIssue({g: github, c: context, unlabeledIssues}) {
    const deletedLabelName = context.payload.label.name;
    const deleterUser = context.payload.sender.login;

    console.log('Deleted label: ', deletedLabelName);
    console.log('Unlabeled issues: ', unlabeledIssues);
    console.log('Deleted by: ', deleterUser);

    // TODO: Create the notification issue and post comments
}

module.exports = createUnlabelNotificationIssue