# ![NodeBB](public/images/logo.svg)

[![Build Status](https://travis-ci.org/NodeBB/NodeBB.svg?branch=master)](https://travis-ci.org/NodeBB/NodeBB)
[![Coverage Status](https://coveralls.io/repos/github/NodeBB/NodeBB/badge.svg?branch=master)](https://coveralls.io/github/NodeBB/NodeBB?branch=master)
[![Code Climate](https://codeclimate.com/github/NodeBB/NodeBB/badges/gpa.svg)](https://codeclimate.com/github/NodeBB/NodeBB)

[**NodeBB Forum Software**] is powered by Node.js and supports either Redis, MongoDB, or a PostgreSQL database. It utilizes web sockets for instant interactions and real-time notifications. NodeBB has many modern features out of the box such as social network integration and streaming discussions, while still making sure to be compatible with older browsers.

## Requirements

NodeBB requires the following software to be installed:

* A version of Node.js at least 12 or greater
* MongoDB, version 2.6 or greater **or** Redis, version 2.8.9 or greater
* If you are using clustering you need Redis installed and configured.
* nginx, version 1.3.13 or greater (**only if** intending to use nginx to proxy requests to a NodeBB)

## Installation

[Please refer to platform-specific installation documentation](https://docs.nodebb.org/installing/os)

1. Clone this repo and do `npm install`
2. Create a new configuration file i.e. `config.json`
3. The config file should contain the following values:

```bash
{
    "url": "http://127.0.0.1:4567",
    "secret": "<JWT SECRET STRING>",
    "database": "mongo",
    "mongo": {
        "host": "127.0.0.1",
        "port": "27017",
        "username": "<USERNAME>",
        "password": "<PASSWORD>",
        "database": "nodebb",
        "uri": "mongodb+srv://<YOUR MONGO URL>"
    },
    "port": "4567" //PORT WHERE NODEBB SHOULD START
}
```

4. You need to build the forum by `./nodebb build`
5. Than you can start the forum by `./nodebb start`
> **Additional details:** To stop nodebb use `./nodebb stop` or restart by `./nodebb restart`

## Securing NodeBB

It is important to ensure that your NodeBB and database servers are secured. Bear these points in mind:

1. While some distributions set up Redis with a more restrictive configuration, Redis by default listens to all interfaces, which is especially dangerous when a server is open to the public. Some suggestions:
    * Set `bind_address` to `127.0.0.1` so as to restrict access  to the local machine only
    * Use `requirepass` to secure Redis behind a password (preferably a long one)
    * Familiarise yourself with [Redis Security](http://redis.io/topics/security)
2. Use `iptables` to secure your server from unintended open ports. In Ubuntu, `ufw` provides a friendlier interface to working with `iptables`.
    * e.g. If your NodeBB is proxied, no ports should be open except 80 (and possibly 22, for SSH access)

## License

NodeBB is licensed under the **GNU General Public License v3 (GPL-3)** (http://www.gnu.org/copyleft/gpl.html).

Interested in a sublicense agreement for use of NodeBB in a non-free/restrictive environment? Contact us at sales@nodebb.org.
