# ds-demo-heroku
Deploy a deepstream.io server on heroku.

This repo was created in combination with a tutorial. You can find the tutorial below. 

## Local setup

```
npm install
```

In order to use the storage and cache connectors you need to provide these environment variables:

##### `MONGODB_URI` 

##### `REDISCLOUD_URL`

---

# Tutorial

In this tutorial you'll see how easy it is to setup a deepstream server on heroku including
a MongoDB storage layer and a redis cache layer.

## Starting from scracth
Let's start from scratch with an empty directory:

```shell
mkdir ds-demo-heroku
cd ds-demo-heroku
```

Currently there is no heroku add-on or buildpack for deepstream,
so we're going to use a heroku buildpack which based on Node.js.

To create a _package.json_ file we can just run this command:

```shell
npm init
```

If you don't have Node.js (and npm) installed you can also use the package.json at the end of this article.

Now deepstream server can be installed via

```shell
npm install deepstream --save
```

Heroku provides different versions of Node.js which can be specified in the package.json.
So let's add a property to the _package.json_ which defined to use the latest stable Node.js version:

```javascript
  //...
  "engines": {
    "node": "4.4.7"
  },
  //...
```

Heroku applications needs also a [Procfile](https://devcenter.heroku.com/articles/procfile) in the root directory which contains application type and command.
Since deepstream is a server it need to be defined as a `web` type.

```
web: npm start
```

Now lets create the npm start script in the _package.json_:

```javascript
  //..
  "scripts": {
    "start": "deepstream start"
  },
  //..
```

On heroku you can't expose a port directly. Instead heroku will set an environment
variable (`PORT`) which you need to use for your server. This means we need to overwrite
the default deepstream port. We can do this in the deepstream configuration file.
Let's copy the default configuration files to our project directory:

```shell
cp -r node_modules/deepstream.io/conf .
```

Now we need to change the port in the _conf/config.yml_:

```yaml
port: ${PORT}
```

__NOTE__

If you want to access a heroku app from an external network you need to use port
**80**, because all connections will be automatically redirecteed to the internal
port of the environment variable.

## Create a git repository

Deployment with heroku is based on git repositories. So we need to inizialize
the current directory as a git repository via `git init`.

Then we need to ignore the *node_modules* by add this line to a _.gitignore_ file:

```
node_modules
```

Now we need to commit all other files in the current directory:

```shell
git commit -a -m "init commit"
```

Fore more details how to use git, here is a [beginner guide](https://rogerdudler.github.io/git-guide)

## Creating a heroku app and deploy it

If you're not logged in already with the heroku CLI then download
the [heroku toolbelt](https://toolbelt.heroku.com/)
and login with your heroku credentials via `heroku login`.

In the next step we create a heroku app. You should consider to choose a [region](https://devcenter.heroku.com/articles/regions) to avoid unnecessary bigger network delays if most of the connection will come not from the United States which is the default value (us).

This command creates an app with the name **deepstream-test** in Europe:


```shell
heroku apps:create deepstream-test --region eu
```

A git remote (heroku) is also created and associated with your local git repository.
You can see it in your _.git/config_ file.

Now we can push the code (from our local repository) to the remote repository at heroku:

```shell
git push heroku master
```

After ths process is finished we can check the logs on heroku via:

```
heroku logs -t
```

You might notice that the deepstream logo is broken in the logs. This
is because the stdout is streamed asynchronously, so just ignore it ;)

[![asciicast](https://asciinema.org/a/1vu68mmlip64a408i7mxzryis.png)](https://asciinema.org/a/1vu68mmlip64a408i7mxzryis)

## Connect to the deepstream server

To connect the the server you can open this [codepen example](http://codepen.io/timaschew/pen/RRrzjg?editors=1010) and change the `DEEPSTREAM_HOST` to your own host.

You can play around with the codepen and uncomment the `record.set` line and change
the value. If you comment out that line again you should still get the same output.

But if you deploy some code changes or your [heroku dyno goes sleeping](https://devcenter.heroku.com/articles/free-dyno-hours) and waked up again the record data
will be lost. To avoid lossing any data we need to add a storage connector.

## Add a deepstream storage connector

Heroku provides [free addons](https://elements.heroku.com/addons) for databases, logging
and more. We choose a free plan of
[mongolab](https://elements.heroku.com/addons/mongolab) which provides a MongoDB
instance in the cloud. The heroku CLI provides a way do to the whole setup for you,
so you don't to create an account nor you need to care about the credentials,
which are automatically added to your heroku app via a environment variable
(`MONGODB_URI`).

```shell
heroku addons:create mongolab:sandbox
```

You need to verify your account on heroku to use this addon. Otherwise you can
setup the account on mongolab by yourself and set the `MONGODB_URI` environment variable
to your heroku app.

Now let's install the MongoDB connector for deepstream:

```shell
npm install deepstream.io-storage-mongodb --save
```

and add a storage connector configuration snippet to the _conf/config.yml_:

```yaml
plugins:
  storage:
    name: mongodb
    options:
      connectionString: ${MONGODB_URI}
      database: someDb
      defaultTable: someTable
      splitChar: "/"
```

That's it, now we need to add the changes to master branch via

```shell
git commit -a -m "add mongodb connector"
git push heroku master
```

Now all the record data will be persisted (if you add and change them via the codepen example). Even if you stop or restart your heroku app.

## Add a deepstream cache connector

Databases are sometimes to slow for realtime requirements. The focus of a database
is to store data. So if you want to speedup your app you can add a cache layer.
We're going to use another addon on heroku: [rediscloud service](https://elements.heroku.com/addons/rediscloud) provides a free redis server for you heroku apps.
The credentials will be saved in the `REDISCLOUD_URL` environment variable:

```shell
heroku addons:create rediscloud:30
```

and install the redis cache connector for deepstream:

```shell
npm install deepstream.io-cache-redis --save
```

To enable redis with deepstream we need the redis configuraiton to the plugins
object in the _conf/config.yml_:

```yaml
plugins:
  storage:
    name: mongodb
    options:
      connectionString: ${MONGODB_URI}
      database: someDb
      defaultTable: someTable
      splitChar: "/"
  cache:
    name: redis
    options: ${REDISCLOUD_URL}?dropBufferSupport=true
```

In your logs you should see these two lines which indicates that the storage and cache layer are enabled:

```
INFO | cache ready
INFO | storage ready
```

## Resources

Here is the final _package.json_ in case you could not or don't want to use npm
on your local machine:

```json
{
  "name": "ds-demo-heroku",
  "version": "1.0.0",
  "description": "Deploy a deepstream.io server on heroku",
  "main": "index.js",
  "scripts": {
    "start": "deepstream start"
  },
  "engines": {
    "node": "4.4.7"
  },
  "author": "Your Name",
  "license": "ISC",
  "dependencies": {
    "deepstream.io": "github:deepstreamio/deepstream.io",
    "deepstream.io-cache-redis": "^1.0.0",
    "deepstream.io-storage-mongodb": "^1.0.1"
  }
}
```

You can also checkout the final source code on GitHub: https://github.com/deepstreamIO/ds-demo-heroku
