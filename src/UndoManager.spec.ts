import { UndoableEdit } from "./UndoableEdit";
import { UndoManager } from "./UndoManager";

class UndoableSpy extends UndoableEdit {
    public undoneCount = 0;

    public redoneCount = 0;

    public undo(): void {
        this.undoneCount++;
    }

    public redo(): void {
        this.redoneCount++;
    }
}

class UndoableMergeSpy extends UndoableSpy {
    public mergeCalls = 0;

    public mergeCount = 0;

    public merge(edit: UndoableEdit): boolean {
        this.mergeCalls++;
        if (edit instanceof UndoableMergeSpy) {
            this.mergeCount++;
            return true;
        }
        return false;
    }
}

class UndoableReplaceSpy extends UndoableSpy {
    public replaceCalls = 0;

    public replace(edit: UndoableEdit): boolean {
        this.replaceCalls++;
        return edit instanceof UndoableReplaceSpy;
    }
}

class UndoableInsignificantSpy extends UndoableSpy {
    public isSignificant(): boolean {
        return false;
    }
}

class UndoableMerge extends UndoableSpy {
    private readonly oldValue: number;

    private newValue: number;

    public constructor(oldValue: number, newValue: number) {
        super();
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    public merge(edit: UndoableEdit): boolean {
        if (edit instanceof UndoableMerge) {
            this.newValue = edit.newValue;
            return true;
        }
        return false;
    }

    public isSignificant(): boolean {
        return this.newValue !== this.oldValue;
    }
}

describe("UndoManager", () => {
    test("add_undo_and_redo", () => {
        const manager = new UndoManager();
        const undoable = new UndoableSpy();
        manager.add(undoable);
        expect(undoable.undoneCount).toBe(0);
        expect(undoable.redoneCount).toBe(0);
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(false);
        manager.undo();
        expect(undoable.undoneCount).toBe(1);
        expect(undoable.redoneCount).toBe(0);
        manager.redo();
        expect(undoable.undoneCount).toBe(1);
        expect(undoable.redoneCount).toBe(1);
    });

    test("add_two_undo_and_redo", () => {
        const manager = new UndoManager();
        const undoable1 = new UndoableSpy();
        const undoable2 = new UndoableSpy();
        manager.add(undoable1);
        manager.add(undoable2);
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(false);
        manager.undo();
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(true);
        manager.undo();
        expect(undoable1.undoneCount).toBe(1);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        manager.redo();
        expect(undoable1.undoneCount).toBe(1);
        expect(undoable1.redoneCount).toBe(1);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        manager.redo();
        expect(undoable1.undoneCount).toBe(1);
        expect(undoable1.redoneCount).toBe(1);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(1);
    });

    test("add_undo_and_redo_middle", () => {
        const manager = new UndoManager();
        const undoable1 = new UndoableSpy();
        const undoable2 = new UndoableSpy();
        const undoable3 = new UndoableSpy();
        manager.add(undoable1);
        manager.add(undoable2);
        manager.undo();
        manager.add(undoable3);
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(false);
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(0);
        expect(undoable3.redoneCount).toBe(0);
        manager.undo();
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(1);
        expect(undoable3.redoneCount).toBe(0);
        manager.undo();
        expect(undoable1.undoneCount).toBe(1);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(1);
        expect(undoable3.redoneCount).toBe(0);
        manager.redo();
        expect(undoable1.undoneCount).toBe(1);
        expect(undoable1.redoneCount).toBe(1);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(1);
        expect(undoable3.redoneCount).toBe(0);
        manager.redo();
        expect(undoable1.undoneCount).toBe(1);
        expect(undoable1.redoneCount).toBe(1);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(1);
        expect(undoable3.redoneCount).toBe(1);
    });

    test("merge_undo_redo", () => {
        const manager = new UndoManager();
        const undoable1 = new UndoableSpy();
        const undoable2 = new UndoableMergeSpy();
        const undoable3 = new UndoableMergeSpy();
        const undoable4 = new UndoableSpy();
        manager.add(undoable1);
        manager.add(undoable2);
        manager.add(undoable3);
        manager.add(undoable4);
        expect(undoable2.mergeCalls).toBe(2);
        expect(undoable2.mergeCount).toBe(1);
        expect(undoable3.mergeCalls).toBe(0);
        manager.undo();
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(0);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(0);
        expect(undoable3.redoneCount).toBe(0);
        expect(undoable4.undoneCount).toBe(1);
        expect(undoable4.redoneCount).toBe(0);
        manager.undo();
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(0);
        expect(undoable3.redoneCount).toBe(0);
        expect(undoable4.undoneCount).toBe(1);
        expect(undoable4.redoneCount).toBe(0);
        manager.undo();
        expect(undoable1.undoneCount).toBe(1);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(0);
        expect(undoable3.redoneCount).toBe(0);
        expect(undoable4.undoneCount).toBe(1);
        expect(undoable4.redoneCount).toBe(0);
        manager.redo();
        expect(undoable1.undoneCount).toBe(1);
        expect(undoable1.redoneCount).toBe(1);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(0);
        expect(undoable3.redoneCount).toBe(0);
        expect(undoable4.undoneCount).toBe(1);
        expect(undoable4.redoneCount).toBe(0);
        manager.redo();
        expect(undoable1.undoneCount).toBe(1);
        expect(undoable1.redoneCount).toBe(1);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(1);
        expect(undoable3.undoneCount).toBe(0);
        expect(undoable3.redoneCount).toBe(0);
        expect(undoable4.undoneCount).toBe(1);
        expect(undoable4.redoneCount).toBe(0);
        manager.redo();
        expect(undoable1.undoneCount).toBe(1);
        expect(undoable1.redoneCount).toBe(1);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(1);
        expect(undoable3.undoneCount).toBe(0);
        expect(undoable3.redoneCount).toBe(0);
        expect(undoable4.undoneCount).toBe(1);
        expect(undoable4.redoneCount).toBe(1);
    });

    test("limit", () => {
        const manager = new UndoManager(2);
        const undoable1 = new UndoableSpy();
        const undoable2 = new UndoableSpy();
        const undoable3 = new UndoableSpy();
        expect(manager.getLimit()).toBe(2);
        manager.add(undoable1);
        manager.add(undoable2);
        manager.add(undoable3);
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(false);
        manager.undo();
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(true);
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(0);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(1);
        expect(undoable3.redoneCount).toBe(0);
        manager.undo();
        expect(manager.canUndo()).toBe(false);
        expect(manager.canRedo()).toBe(true);
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(1);
        expect(undoable3.redoneCount).toBe(0);
        manager.redo();
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(true);
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(1);
        expect(undoable3.undoneCount).toBe(1);
        expect(undoable3.redoneCount).toBe(0);
        manager.redo();
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(false);
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(1);
        expect(undoable3.undoneCount).toBe(1);
        expect(undoable3.redoneCount).toBe(1);
    });

    test("limit_after_add", () => {
        const manager = new UndoManager();
        const undoable1 = new UndoableSpy();
        const undoable2 = new UndoableSpy();
        const undoable3 = new UndoableSpy();
        manager.add(undoable1);
        manager.add(undoable2);
        manager.add(undoable3);
        manager.setLimit(2);
        expect(manager.getLimit()).toBe(2);
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(false);
        manager.undo();
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(0);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(1);
        expect(undoable3.redoneCount).toBe(0);
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(true);
        manager.undo();
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(1);
        expect(undoable3.redoneCount).toBe(0);
        expect(manager.canUndo()).toBe(false);
        expect(manager.canRedo()).toBe(true);
    });

    test("limit_after_add_save_marker_gone", () => {
        const manager = new UndoManager();
        expect(manager.isModified()).toBe(false);
        manager.add(new UndoableSpy());
        manager.add(new UndoableSpy());
        manager.add(new UndoableSpy());
        manager.setUnmodified();
        manager.undo();
        manager.add(new UndoableSpy());
        manager.setLimit(2);
        expect(manager.isModified()).toBe(true);
        while (manager.canUndo()) {
            manager.undo();
            expect(manager.isModified()).toBe(true);
        }
        while (manager.canRedo()) {
            manager.redo();
            expect(manager.isModified()).toBe(true);
        }
    });

    test("errors", () => {
        const manager = new UndoManager();
        expect(() => manager.undo()).toThrow();
        expect(() => manager.redo()).toThrow();
        manager.add(new UndoableSpy());
        expect(() => manager.redo()).toThrow();
        manager.undo();
        expect(() => manager.undo()).toThrow();
    });

    test("clear", () => {
        const manager = new UndoManager();
        manager.add(new UndoableSpy());
        manager.add(new UndoableSpy());
        manager.add(new UndoableSpy());
        manager.clear();
        expect(manager.canUndo()).toBe(false);
        expect(manager.canRedo()).toBe(false);
        expect(() => manager.undo()).toThrow();
        expect(() => manager.redo()).toThrow();

        // perform basic test afterwards to see if it still works.
        const undoable = new UndoableSpy();
        manager.add(undoable);
        expect(undoable.undoneCount).toBe(0);
        expect(undoable.redoneCount).toBe(0);
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(false);
        manager.undo();
        expect(undoable.undoneCount).toBe(1);
        expect(undoable.redoneCount).toBe(0);
        manager.redo();
        expect(undoable.undoneCount).toBe(1);
        expect(undoable.redoneCount).toBe(1);
    });

    test("insignificant", () => {
        const manager = new UndoManager();
        const undoable1 = new UndoableSpy();
        const undoable2 = new UndoableInsignificantSpy();
        const undoable3 = new UndoableInsignificantSpy();
        const undoable4 = new UndoableSpy();
        manager.add(undoable1);
        manager.add(undoable2);
        manager.add(undoable3);
        manager.add(undoable4);
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(0);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(0);
        expect(undoable3.redoneCount).toBe(0);
        expect(undoable4.undoneCount).toBe(0);
        expect(undoable4.redoneCount).toBe(0);
        manager.undo();
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(0);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(0);
        expect(undoable3.redoneCount).toBe(0);
        expect(undoable4.undoneCount).toBe(1);
        expect(undoable4.redoneCount).toBe(0);
        manager.undo();
        expect(undoable1.undoneCount).toBe(1);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(1);
        expect(undoable3.redoneCount).toBe(0);
        expect(undoable4.undoneCount).toBe(1);
        expect(undoable4.redoneCount).toBe(0);
        expect(manager.canUndo()).toBe(false);
        manager.redo();
        expect(undoable1.undoneCount).toBe(1);
        expect(undoable1.redoneCount).toBe(1);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        expect(undoable3.undoneCount).toBe(1);
        expect(undoable3.redoneCount).toBe(0);
        expect(undoable4.undoneCount).toBe(1);
        expect(undoable4.redoneCount).toBe(0);
        manager.redo();
        expect(undoable1.undoneCount).toBe(1);
        expect(undoable1.redoneCount).toBe(1);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(1);
        expect(undoable3.undoneCount).toBe(1);
        expect(undoable3.redoneCount).toBe(1);
        expect(undoable4.undoneCount).toBe(1);
        expect(undoable4.redoneCount).toBe(1);
        expect(manager.canRedo()).toBe(false);
    });

    test("save_marker", () => {
        const manager = new UndoManager();
        expect(manager.isModified()).toBe(false);
        const undoable1 = new UndoableSpy();
        manager.add(undoable1);
        expect(manager.isModified()).toBe(true);
        manager.undo();
        expect(manager.isModified()).toBe(false);
        manager.redo();
        expect(manager.isModified()).toBe(true);
        manager.setUnmodified();
        expect(manager.isModified()).toBe(false);
        manager.undo();
        expect(manager.isModified()).toBe(true);
        manager.redo();
        expect(manager.isModified()).toBe(false);
    });

    test("save_marker_gone", () => {
        const manager = new UndoManager();
        expect(manager.isModified()).toBe(false);
        manager.add(new UndoableSpy());
        manager.add(new UndoableSpy());
        manager.setUnmodified();
        expect(manager.isModified()).toBe(false);
        manager.undo();
        expect(manager.isModified()).toBe(true);
        manager.add(new UndoableSpy());
        expect(manager.isModified()).toBe(true);
        while (manager.canUndo()) {
            manager.undo();
            expect(manager.isModified()).toBe(true);
        }
        while (manager.canRedo()) {
            manager.redo();
            expect(manager.isModified()).toBe(true);
        }
    });

    test("save_marker_insignificant", () => {
        const manager = new UndoManager();
        const undoable1 = new UndoableSpy();
        const undoable2 = new UndoableInsignificantSpy();
        const undoable3 = new UndoableInsignificantSpy();
        const undoable4 = new UndoableSpy();
        manager.add(undoable1);
        manager.add(undoable2);
        manager.add(undoable3);
        manager.add(undoable4);

        expect(manager.isModified()).toBe(true);
        manager.setUnmodified();
        expect(manager.isModified()).toBe(false);
        manager.undo(); // 4 undone
        expect(manager.isModified()).toBe(true);
        manager.setUnmodified();
        expect(manager.isModified()).toBe(false);
        manager.undo(); // 3,2,1 undone
        expect(manager.isModified()).toBe(true);
        manager.redo(); // 1 redone
        expect(manager.isModified()).toBe(false);
        manager.redo(); // 2,3,4 redone
        expect(manager.isModified()).toBe(true);
        manager.setUnmodified();
        manager.undo(); // 4 undone
        manager.undo(); // 3,2,1 undone
        expect(manager.isModified()).toBe(true);
        manager.redo(); // 1 redone
        expect(manager.isModified()).toBe(true);
        manager.redo(); // 2,3,4 redone
        expect(manager.isModified()).toBe(false);
    });

    test("save_marker_merged_insignificant", () => {
        const manager = new UndoManager();
        manager.add(new UndoableMerge(0, 1));
        expect(manager.isModified()).toBe(true);
        manager.add(new UndoableMerge(1, 0));
        expect(manager.isModified()).toBe(false);
    });

    test("save_marker_saved_then_merged_insignificant", () => {
        const manager = new UndoManager();
        manager.add(new UndoableMerge(0, 1));
        expect(manager.isModified()).toBe(true);
        manager.setUnmodified();
        manager.add(new UndoableMerge(1, 0));
        expect(manager.isModified()).toBe(true);
    });

    test("replace", () => {
        const manager = new UndoManager();
        const undoable1 = new UndoableReplaceSpy();
        const undoable2 = new UndoableReplaceSpy();
        manager.add(undoable1);
        manager.add(undoable2);
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(false);
        manager.undo();
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(0);
        expect(manager.canUndo()).toBe(false);
        expect(manager.canRedo()).toBe(true);
        manager.redo();
        expect(undoable1.undoneCount).toBe(0);
        expect(undoable1.redoneCount).toBe(0);
        expect(undoable2.undoneCount).toBe(1);
        expect(undoable2.redoneCount).toBe(1);
        expect(manager.canUndo()).toBe(true);
        expect(manager.canRedo()).toBe(false);
    });

    test("listener", () => {
        let count = 0;
        const manager = new UndoManager();
        manager.setListener(() => count++);
        expect(count).toBe(0);
        manager.add(new UndoableSpy());
        expect(count).toBe(1);
        manager.undo();
        expect(count).toBe(2);
        manager.redo();
        expect(count).toBe(3);
        manager.clear();
        expect(count).toBe(4);

        manager.add(new UndoableSpy());
        expect(count).toBe(5);
        manager.add(new UndoableInsignificantSpy());
        expect(count).toBe(6);
        manager.add(new UndoableInsignificantSpy());
        expect(count).toBe(7);
        manager.add(new UndoableSpy());
        expect(count).toBe(8);
        manager.undo();
        expect(count).toBe(9);
        manager.undo();
        expect(count).toBe(10);
        expect(manager.canUndo()).toBe(false);
    });
});
