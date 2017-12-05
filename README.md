![](https://lusito.github.io/typed-undo/typed_undo.png)

[![License](https://img.shields.io/badge/License-zlib/libpng-blue.svg)](https://github.com/Lusito/typed-undo/blob/master/LICENSE)

|Master|[![Build Status](https://travis-ci.org/Lusito/typed-undo.svg?branch=master)](https://travis-ci.org/Lusito/typed-undo)|[![Code Coverage](https://coveralls.io/repos/github/Lusito/typed-undo/badge.svg?branch=master)](https://coveralls.io/github/Lusito/typed-undo)|
|---|---|---|
|Develop|[![Build Status](https://travis-ci.org/Lusito/typed-undo.svg?branch=develop)](https://travis-ci.org/Lusito/typed-undo)|[![Code Coverage](https://coveralls.io/repos/github/Lusito/typed-undo/badge.svg?branch=develop)](https://coveralls.io/github/Lusito/typed-undo)|

An UndoManager for TypeScript (and JavaScript). The basic idea is based on the UndoManager from Java.

### Why Typed-Undo?

- Easily add memory-efficient undo/redo functionality.
  - You can merge and replace edits, just like in the Java UndoManager.
- You can mark a save-point, to enable/disable your save-button.
- Undo/Redo non-edit related changes, like focus change, without it being marked as needs-to-be-saved.
- No dependencies
- Automated [unit tests](https://travis-ci.org/Lusito/typed-undo) with 100% [code coverage](https://coveralls.io/github/Lusito/typed-undo)
- Liberal license: [zlib/libpng](https://github.com/Lusito/typed-undo/blob/master/LICENSE)
- [Fully documented](https://lusito.github.io/typed-undo/index.html) using TypeDoc

### Installation via NPM

```npm install typed-undo --save```

### Example

```typescript
import { UndoManager, UndoableEdit } from "typed-undo";

class UndoableValueChange extends UndoableEdit {
    private readonly oldValue: string;
    private newValue: string;
    private readonly applyValue: (value: string) => void;

    public constructor(oldValue: string, newValue: string, applyValue: (value: string) => void) {
        super();
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.applyValue = applyValue;
    }

    public undo(): void {
        this.applyValue(this.oldValue);
    }

    public redo(): void {
        this.applyValue(this.newValue);
    }

    public isSignificant(): boolean {
        return this.oldValue !== this.newValue;
    }

    public merge(edit: UndoableEdit): boolean {
        if (edit instanceof UndoableValueChange) {
            this.newValue = edit.newValue;
            return true;
        }
        return false;
    }
}

const manager = new UndoManager();
manager.setListener(()=> {
    console.log((manager.canUndo() ? "enable" : "disable") + " the undo button");
    console.log((manager.canRedo() ? "enable" : "disable") + " the redo button");
    console.log((manager.isModified() ? "enable" : "disable") + " the save button");
});
const applyValue = (value:string)=> console.log(`Value changed to "${value}"`);
const example = "basic";
if(example === "basic") {
    applyValue("Foo Bar"); // Value changed to "Foo Bar"
    manager.add(new UndoableValueChange("Hello World", "Foo Bar", applyValue));
    manager.undo(); // Value changed to "Hello World"
    manager.redo(); // Value changed to "Foo Bar"
} else if(example === "merge") {
    manager.add(new UndoableValueChange("Hello World", "Foo Bar", applyValue));
    console.log(manager.canUndo()); // true
    console.log(manager.isModified()); // true
    manager.add(new UndoableValueChange("Foo Bar", "Hello World", applyValue));
    console.log(manager.canUndo()); // false
    console.log(manager.isModified()); // false
} else if(example === "modified") {
    console.log(manager.isModified()); // false
    manager.add(new UndoableValueChange("Hello World", "Foo Bar", applyValue));
    console.log(manager.isModified()); // true
    manager.setUnmodified();
    console.log(manager.isModified()); // false
    manager.undo();
    console.log(manager.isModified()); // true
    manager.redo();
    console.log(manager.isModified()); // false
}
```

### Report isssues

Something not working quite as expected? Do you need a feature that has not been implemented yet? Check the [issue tracker](https://github.com/Lusito/typed-undo/issues) and add a new one if your problem is not already listed. Please try to provide a detailed description of your problem, including the steps to reproduce it.

### Contribute

Awesome! If you would like to contribute with a new feature or submit a bugfix, fork this repo and send a pull request. Please, make sure all the unit tests are passing before submitting and add new ones in case you introduced new features.

### License

Typed-Undo has been released under the [zlib/libpng](https://github.com/Lusito/typed-undo/blob/master/LICENSE) license, meaning you
can use it free of charge, without strings attached in commercial and non-commercial projects. Credits are appreciated but not mandatory.
