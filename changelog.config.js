var Haikunator = require('haikunator')

module.exports = {

  // Jira integration
  jira: {

    // API
    api: {
      host: 'kualico.atlassian.net',
      username: process.env.JIRA_USERNAME,
      password: process.env.JIRA_PASSWORD,
    },

    // Jira base web URL
    // Set to the base URL for your Jira account
    baseUrl: 'https://kualico.atlassian.net',

    // The Jira project name (use for creating release versions)
    project: undefined,

    // Regex used to match the issue ticket key
    // Use capture group one to isolate the key text within surrounding characters (if needed).
    ticketIDPattern: /(RESKC-[0-9]+):? /i,

    // Status names that mean the ticket is approved.
    approvalStatus: ['Resolved', 'Closed', 'Delivered'],

    // Tickets to exclude from the changelog, by type name
    excludeIssueTypes: ['Sub-task'],

    // Tickets to include in changelog, by type name.
    // If this is defined, `excludeIssueTypes` is ignored.
    includeIssueTypes: [],

    // Get the release version name to use when using `--release` without a value.
    // Returns a Promise
    generateReleaseVersionName: function() {
      const haikunator = new Haikunator();
      return Promise.resolve(haikunator.haikunate());
    }
  },

  // Slack API integration
  slack: {

    // API key string
    apiKey: undefined,

    // The channel that the changelog will be posted in, when you use the `--slack` flag.
    // This can be a channel string ('#mychannel`) or a channel ID.
    channel: undefined,

    // The name to give the slack bot user, when posting the changelog
    username: "Changelog Bot",

    // Emoji to use for the bot icon.
    // Cannot be used at the same time as `icon_url`
    icon_emoji: ":clipboard:",

    // URL to an image to use as the icon for the bot.
    // Cannot be used at the same time as `icon_emoji`
    icon_url: undefined
  },

  // Github settings
  sourceControl: {

    // Default range for commits.
    // This can include from/to git commit references
    // and or after/before datestamps.
    defaultRange: {
      '--since': "2018-01-01"
    }
  },

  // Transform from commits by ticket to commits by release per the (tag: vx.y.z) in summary
  transformData: function(data) {
    const commits = data.commits.all.reduce((accumulator, commit) => {
      const version = commit.summary.match(/\(tag: (v\d{2}\.\d{1,2}.\d{1,3})\)/);
      if (version || !accumulator.length) {
        accumulator.push({
          version: version && version[1] || 'CURRENT',
          commits: version ? [] : [commit]
        });
      } else {
        accumulator[accumulator.length-1].commits.push(commit);
      }
      
      return accumulator;
    }, []);

    return Promise.resolve({commits});
  },

  // Transform the changelog before posting to slack
  //  content - The changelog content which was output by the command
  //  data - The data which generated the changelog content.
  transformForSlack: function(content, data) {
    return Promise.resolve(content);
  },

  // The template that generates the output, as an ejs template.
  // Learn more: http://ejs.co/
  template:
`<% commits.forEach(release => { %>
## <%= release.version %>
  <% release.commits.forEach(commit => { %>
  * <%= commit.summary %>
    * <%= commit.authorName %> on <%= commit.date %> [View Commit](../../commit/<%= commit.revision %>)
  <% }); -%>  
<% }); -%>
`
};
