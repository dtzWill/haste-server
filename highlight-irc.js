/*
Language: irclog
Author: Will Dietz <w@wdtz.org>
Website: N/A
Description: Logs produced by my irssi style/configuration.
*/
function(hljs) {
  var WRAPPING_RE = /$\n(?! )/;
  var LINKS = {
    className: 'link_url',
    begin: '(http|https|ftp|ftps|file|irc|image:?):\\S+'
  };
  var MESSAGE = {
    end: WRAPPING_RE,
    contains: [ LINKS ]
  };
  var AFTER_TIMESTAMP = {
    className: 'after',
    contains: [
    {
      className: 'info',
      begin: / ==>/,
      end: WRAPPING_RE
      // TODO: recognize and style common info messages
    },
    {
      className: 'nick_full',
      // TODO: '>> nick <<' means this is a highlighted line, style differently?
      begin: / (>>|<)/,
      end: /(>|<<) /,
      contains: [
      {
        className: 'nick_rank',
        begin: '[\\+@& ]'
      },
      {
        className: 'nick',
        begin: /[^><\\+@& ]+/
      }
      ],
      starts: MESSAGE
    },
    {
      className: 'nick',
      begin: / [^><=]\S*/,
      starts: MESSAGE
    }
    ]
  };
  return {
    aliases: ['irssi', 'irclog'],
    contains: [
    {
      className: 'timestamp',
      begin: '^\\d\\d:\\d\\d(:\\d\\d)?(?!:)',
      starts: AFTER_TIMESTAMP
    },
    {
      className: 'timestamp_styled',
      begin: '^\\.:',
      end: ':\\.',
      contains: [ {
        className: 'timestamp',
        begin: '\\d\\d:\\d\\d:\\d\\d',
        relevance: 50
      } ],
      starts: AFTER_TIMESTAMP
    },
    {
      className: "header", // close enough
      begin: /^---/,
      end: WRAPPING_RE
    },
    // Match links outside of log entries:
    LINKS
    ]
  };
}
