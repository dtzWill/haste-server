/*
Language: irclog
Author: Will Dietz <w@wdtz.org>
Website: N/A
Description: Logs produced by my irssi style/configuration.
  "Inspired" by asciidoc language definition.
*/
function(hljs) {
  return {
    aliases: ['irssi', 'irclog'],
    contains: [
      // message prefix
      // Matching this in one go avoids matching from message content
    {
      className: 'message_prefix',
      begin: '^\\.:',
      end: />/,
      returnBegin: true,
      contains: [
      // timestamp styling, timestamp within
      {
        className: 'timestamp_styled',
        begin: '\\.:',
        end: ':\\.',
        contains: [
        {
          className: 'timestamp',
          begin: '\\d\\d:\\d\\d:\\d\\d',
          relevance: 50
        }
        ]
      },

      // nick
      {
        className: 'nick_full',
        begin: /</,
        end: />/,
        returnBegin: true,
        returnEnd: true,
        contains: [
        {
          className: 'nick_rank',
          begin: '<',
          end: '(\\+| |\\@|\\&)',
          excludeBegin: true
        },
        {
          className: 'nick',
          begin: hljs.IDENT_RE,
          end: />/,
          returnEnd: true
        }
        ]
      }
      ],
      relevance: 10
    },
    // Links
    {
      className: 'link_url',
      begin: '(http|https|ftp|ftps|file|irc|image:?):\\S+'
    }
    ]
  };
}
