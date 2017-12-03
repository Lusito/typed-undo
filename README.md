![](https://lusito.github.io/typed-undomanager/typed_undomanager.png)

[![License](https://img.shields.io/badge/License-zlib/libpng-blue.svg)](https://github.com/Lusito/typed-undomanager/blob/master/LICENSE)

|Master|[![Build Status](https://travis-ci.org/Lusito/typed-undomanager.svg?branch=master)](https://travis-ci.org/Lusito/typed-undomanager)|[![Code Coverage](https://coveralls.io/repos/github/Lusito/typed-undomanager/badge.svg?branch=master)](https://coveralls.io/github/Lusito/typed-undomanager)|
|---|---|---|
|Develop|[![Build Status](https://travis-ci.org/Lusito/typed-undomanager.svg?branch=develop)](https://travis-ci.org/Lusito/typed-undomanager)|[![Code Coverage](https://coveralls.io/repos/github/Lusito/typed-undomanager/badge.svg?branch=develop)](https://coveralls.io/github/Lusito/typed-undomanager)|

An UndoManager for TypeScript (and JavaScript). The basic idea is based on the UndoManager from Java.

### Why Typed-UndoManager?

- Easily add memory-efficient undo/redo functionality.
  - You can merge and replace edits, just like in the Java UndoManager.
- You can mark a save-point, to enable/disable your save-button.
- Undo/Redo non-edit related changes, like focus change, without it being marked as needs-to-be-saved.
- No dependencies
- Automated [unit tests](https://travis-ci.org/Lusito/typed-undomanager)  with 100% [code coverage](https://coveralls.io/github/Lusito/typed-undomanager)
- Liberal license: [zlib/libpng](https://github.com/Lusito/typed-undomanager/blob/master/LICENSE)
- [Fully documented](https://lusito.github.io/typed-undomanager/index.html) using TypeDoc

### Installation via NPM

```npm install typed-undomanager --save```

### Basics

```typescript
import { UndoManager, UndoableEdit } from "typed-undomanager";

class MyUndoableEdit extends UndoableEdit {
    private readonly oldValue: string;
    private newValue: string;

	public undo(): void {
	}

	public redo(): void {
	}
}

const manager = new UndoManager();
// fixme: examples
```

### Report isssues

Something not working quite as expected? Do you need a feature that has not been implemented yet? Check the [issue tracker](https://github.com/Lusito/typed-undomanager/issues) and add a new one if your problem is not already listed. Please try to provide a detailed description of your problem, including the steps to reproduce it.

### Contribute

Awesome! If you would like to contribute with a new feature or submit a bugfix, fork this repo and send a pull request. Please, make sure all the unit tests are passing before submitting and add new ones in case you introduced new features.

### License

Typed-UndoManager has been released under the [zlib/libpng](https://github.com/Lusito/typed-undomanager/blob/master/LICENSE) license, meaning you
can use it free of charge, without strings attached in commercial and non-commercial projects. Credits are appreciated but not mandatory.
