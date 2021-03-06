{

  "host": "0.0.0.0",
  "port": 7777,

  "keyLength": 5,

  "maxLength": 2097152,

  "staticMaxAge": 86400,

  "recompressStaticAssets": true,

  "logging": [
    {
      "level": "verbose",
      "type": "Console",
      "colorize": true
    }
  ],

  "keyGenerator": {
    "type": "phonetic"
  },

  "storage": {
    "type": "redis",
    "host": "redis",
    "port": 6379,
    "db": 2,
    "expire": 94610000
  },

  "documents": {
    "about": "./about.md"
  }

}
