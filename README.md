# dep-checks

`dep-checks` is a basic Javascript utility that check your npm project and search for updates on your dependencies and devDependencies.

Once you execute the module and accept to update the modules, the new versions will be installed with the exact version. For example, if you have installed a package and is stored in your _package.json_ file as `package: "^1.0.0"`, `up-deps` will look for the lastest version of that package and install it if you want, but as an exact version, like `package: "1.2.1"`.

## Usage

The simpliest way to run the script is with npx:

```shell
npx up-deps@latest
```

You can also install the module as a devDependencie and use it as a npm script:

```shell
npm i up-deps@latest -D
```
_package.json:_
```json
{
    "scripts": {
        "updeps": "up-deps"
    }
}
```
