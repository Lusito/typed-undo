/**
 * License: zlib/libpng
 * @author Santo Pfingsten
 * @see https://github.com/Lusito/typed-undo
 */

import { suite, test } from "mocha-typescript";
import { assert } from "chai";
import { UndoManager, UndoableEdit } from "../src/UndoManager";

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

@suite export class UndoManagerTests {
	@test add_undo_and_redo() {
		const manager = new UndoManager();
		const undoable = new UndoableSpy();
		manager.add(undoable);
		assert.equal(undoable.undoneCount, 0);
		assert.equal(undoable.redoneCount, 0);
		assert.isTrue(manager.canUndo());
		assert.isFalse(manager.canRedo());
		manager.undo();
		assert.equal(undoable.undoneCount, 1);
		assert.equal(undoable.redoneCount, 0);
		manager.redo();
		assert.equal(undoable.undoneCount, 1);
		assert.equal(undoable.redoneCount, 1);
	}

	@test add_two_undo_and_redo() {
		const manager = new UndoManager();
		const undoable1 = new UndoableSpy();
		const undoable2 = new UndoableSpy();
		manager.add(undoable1);
		manager.add(undoable2);
		assert.isTrue(manager.canUndo());
		assert.isFalse(manager.canRedo());
		manager.undo();
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		assert.isTrue(manager.canUndo());
		assert.isTrue(manager.canRedo());
		manager.undo();
		assert.equal(undoable1.undoneCount, 1);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		manager.redo();
		assert.equal(undoable1.undoneCount, 1);
		assert.equal(undoable1.redoneCount, 1);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		manager.redo();
		assert.equal(undoable1.undoneCount, 1);
		assert.equal(undoable1.redoneCount, 1);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 1);
	}

	@test add_undo_and_redo_middle() {
		const manager = new UndoManager();
		const undoable1 = new UndoableSpy();
		const undoable2 = new UndoableSpy();
		const undoable3 = new UndoableSpy();
		manager.add(undoable1);
		manager.add(undoable2);
		manager.undo();
		manager.add(undoable3);
		assert.isTrue(manager.canUndo());
		assert.isFalse(manager.canRedo());
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 0);
		assert.equal(undoable3.redoneCount, 0);
		manager.undo();
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 1);
		assert.equal(undoable3.redoneCount, 0);
		manager.undo();
		assert.equal(undoable1.undoneCount, 1);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 1);
		assert.equal(undoable3.redoneCount, 0);
		manager.redo();
		assert.equal(undoable1.undoneCount, 1);
		assert.equal(undoable1.redoneCount, 1);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 1);
		assert.equal(undoable3.redoneCount, 0);
		manager.redo();
		assert.equal(undoable1.undoneCount, 1);
		assert.equal(undoable1.redoneCount, 1);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 1);
		assert.equal(undoable3.redoneCount, 1);
	}

	@test merge_undo_redo() {
		const manager = new UndoManager();
		const undoable1 = new UndoableSpy();
		const undoable2 = new UndoableMergeSpy();
		const undoable3 = new UndoableMergeSpy();
		const undoable4 = new UndoableSpy();
		manager.add(undoable1);
		manager.add(undoable2);
		manager.add(undoable3);
		manager.add(undoable4);
		assert.equal(undoable2.mergeCalls, 2);
		assert.equal(undoable2.mergeCount, 1);
		assert.equal(undoable3.mergeCalls, 0);
		manager.undo();
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 0);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 0);
		assert.equal(undoable3.redoneCount, 0);
		assert.equal(undoable4.undoneCount, 1);
		assert.equal(undoable4.redoneCount, 0);
		manager.undo();
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 0);
		assert.equal(undoable3.redoneCount, 0);
		assert.equal(undoable4.undoneCount, 1);
		assert.equal(undoable4.redoneCount, 0);
		manager.undo();
		assert.equal(undoable1.undoneCount, 1);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 0);
		assert.equal(undoable3.redoneCount, 0);
		assert.equal(undoable4.undoneCount, 1);
		assert.equal(undoable4.redoneCount, 0);
		manager.redo();
		assert.equal(undoable1.undoneCount, 1);
		assert.equal(undoable1.redoneCount, 1);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 0);
		assert.equal(undoable3.redoneCount, 0);
		assert.equal(undoable4.undoneCount, 1);
		assert.equal(undoable4.redoneCount, 0);
		manager.redo();
		assert.equal(undoable1.undoneCount, 1);
		assert.equal(undoable1.redoneCount, 1);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 1);
		assert.equal(undoable3.undoneCount, 0);
		assert.equal(undoable3.redoneCount, 0);
		assert.equal(undoable4.undoneCount, 1);
		assert.equal(undoable4.redoneCount, 0);
		manager.redo();
		assert.equal(undoable1.undoneCount, 1);
		assert.equal(undoable1.redoneCount, 1);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 1);
		assert.equal(undoable3.undoneCount, 0);
		assert.equal(undoable3.redoneCount, 0);
		assert.equal(undoable4.undoneCount, 1);
		assert.equal(undoable4.redoneCount, 1);
	}

	@test limit() {
		const manager = new UndoManager(2);
		const undoable1 = new UndoableSpy();
		const undoable2 = new UndoableSpy();
		const undoable3 = new UndoableSpy();
		assert.equal(manager.getLimit(), 2);
		manager.add(undoable1);
		manager.add(undoable2);
		manager.add(undoable3);
		assert.isTrue(manager.canUndo());
		assert.isFalse(manager.canRedo());
		manager.undo();
		assert.isTrue(manager.canUndo());
		assert.isTrue(manager.canRedo());
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 0);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 1);
		assert.equal(undoable3.redoneCount, 0);
		manager.undo();
		assert.isFalse(manager.canUndo());
		assert.isTrue(manager.canRedo());
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 1);
		assert.equal(undoable3.redoneCount, 0);
		manager.redo();
		assert.isTrue(manager.canUndo());
		assert.isTrue(manager.canRedo());
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 1);
		assert.equal(undoable3.undoneCount, 1);
		assert.equal(undoable3.redoneCount, 0);
		manager.redo();
		assert.isTrue(manager.canUndo());
		assert.isFalse(manager.canRedo());
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 1);
		assert.equal(undoable3.undoneCount, 1);
		assert.equal(undoable3.redoneCount, 1);
	}

	@test limit_after_add() {
		const manager = new UndoManager();
		const undoable1 = new UndoableSpy();
		const undoable2 = new UndoableSpy();
		const undoable3 = new UndoableSpy();
		manager.add(undoable1);
		manager.add(undoable2);
		manager.add(undoable3);
		manager.setLimit(2);
		assert.equal(manager.getLimit(), 2);
		assert.isTrue(manager.canUndo());
		assert.isFalse(manager.canRedo());
		manager.undo();
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 0);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 1);
		assert.equal(undoable3.redoneCount, 0);
		assert.isTrue(manager.canUndo());
		assert.isTrue(manager.canRedo());
		manager.undo();
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 1);
		assert.equal(undoable3.redoneCount, 0);
		assert.isFalse(manager.canUndo());
		assert.isTrue(manager.canRedo());
	}

	@test limit_after_add_save_marker_gone() {
		const manager = new UndoManager();
		assert.isFalse(manager.isModified());
		manager.add(new UndoableSpy());
		manager.add(new UndoableSpy());
		manager.add(new UndoableSpy());
		manager.setUnmodified();
		manager.undo();
		manager.add(new UndoableSpy());
		manager.setLimit(2);
		assert.isTrue(manager.isModified());
		while(manager.canUndo()) {
			manager.undo();
			assert.isTrue(manager.isModified());
		}
		while(manager.canRedo()) {
			manager.redo();
			assert.isTrue(manager.isModified());
		}
	}

	@test errors() {
		const manager = new UndoManager();
		assert.throws(() => manager.undo());
		assert.throws(() => manager.redo());
		manager.add(new UndoableSpy());
		assert.throws(() => manager.redo());
		manager.undo();
		assert.throws(() => manager.undo());
	}

	@test clear() {
		const manager = new UndoManager();
		manager.add(new UndoableSpy());
		manager.add(new UndoableSpy());
		manager.add(new UndoableSpy());
		manager.clear();
		assert.isFalse(manager.canUndo());
		assert.isFalse(manager.canRedo());
		assert.throws(() => manager.undo());
		assert.throws(() => manager.redo());

		// perform basic test afterwards to see if it still works.
		const undoable = new UndoableSpy();
		manager.add(undoable);
		assert.equal(undoable.undoneCount, 0);
		assert.equal(undoable.redoneCount, 0);
		assert.isTrue(manager.canUndo());
		assert.isFalse(manager.canRedo());
		manager.undo();
		assert.equal(undoable.undoneCount, 1);
		assert.equal(undoable.redoneCount, 0);
		manager.redo();
		assert.equal(undoable.undoneCount, 1);
		assert.equal(undoable.redoneCount, 1);
	}

	@test insignificant() {
		const manager = new UndoManager();
		const undoable1 = new UndoableSpy();
		const undoable2 = new UndoableInsignificantSpy();
		const undoable3 = new UndoableInsignificantSpy();
		const undoable4 = new UndoableSpy();
		manager.add(undoable1);
		manager.add(undoable2);
		manager.add(undoable3);
		manager.add(undoable4);
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 0);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 0);
		assert.equal(undoable3.redoneCount, 0);
		assert.equal(undoable4.undoneCount, 0);
		assert.equal(undoable4.redoneCount, 0);
		manager.undo();
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 0);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 0);
		assert.equal(undoable3.redoneCount, 0);
		assert.equal(undoable4.undoneCount, 1);
		assert.equal(undoable4.redoneCount, 0);
		manager.undo();
		assert.equal(undoable1.undoneCount, 1);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 1);
		assert.equal(undoable3.redoneCount, 0);
		assert.equal(undoable4.undoneCount, 1);
		assert.equal(undoable4.redoneCount, 0);
		assert.isFalse(manager.canUndo());
		manager.redo();
		assert.equal(undoable1.undoneCount, 1);
		assert.equal(undoable1.redoneCount, 1);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		assert.equal(undoable3.undoneCount, 1);
		assert.equal(undoable3.redoneCount, 0);
		assert.equal(undoable4.undoneCount, 1);
		assert.equal(undoable4.redoneCount, 0);
		manager.redo();
		assert.equal(undoable1.undoneCount, 1);
		assert.equal(undoable1.redoneCount, 1);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 1);
		assert.equal(undoable3.undoneCount, 1);
		assert.equal(undoable3.redoneCount, 1);
		assert.equal(undoable4.undoneCount, 1);
		assert.equal(undoable4.redoneCount, 1);
		assert.isFalse(manager.canRedo());
	}

	@test save_marker() {
		const manager = new UndoManager();
		assert.isFalse(manager.isModified());
		const undoable1 = new UndoableSpy();
		manager.add(undoable1);
		assert.isTrue(manager.isModified());
		manager.undo();
		assert.isFalse(manager.isModified());
		manager.redo();
		assert.isTrue(manager.isModified());
		manager.setUnmodified();
		assert.isFalse(manager.isModified());
		manager.undo();
		assert.isTrue(manager.isModified());
		manager.redo();
		assert.isFalse(manager.isModified());
	}

	@test save_marker_gone() {
		const manager = new UndoManager();
		assert.isFalse(manager.isModified());
		manager.add(new UndoableSpy());
		manager.add(new UndoableSpy());
		manager.setUnmodified();
		assert.isFalse(manager.isModified());
		manager.undo();
		assert.isTrue(manager.isModified());
		manager.add(new UndoableSpy());
		assert.isTrue(manager.isModified());
		while(manager.canUndo()) {
			manager.undo();
			assert.isTrue(manager.isModified());
		}
		while(manager.canRedo()) {
			manager.redo();
			assert.isTrue(manager.isModified());
		}
	}

	@test save_marker_insignificant() {
		const manager = new UndoManager();
		const undoable1 = new UndoableSpy();
		const undoable2 = new UndoableInsignificantSpy();
		const undoable3 = new UndoableInsignificantSpy();
		const undoable4 = new UndoableSpy();
		manager.add(undoable1);
		manager.add(undoable2);
		manager.add(undoable3);
		manager.add(undoable4);

		assert.isTrue(manager.isModified());
		manager.setUnmodified();
		assert.isFalse(manager.isModified());
		manager.undo(); // 4 undone
		assert.isTrue(manager.isModified());
		manager.setUnmodified();
		assert.isFalse(manager.isModified());
		manager.undo(); // 3,2,1 undone
		assert.isTrue(manager.isModified());
		manager.redo(); // 1 redone
		assert.isFalse(manager.isModified());
		manager.redo(); // 2,3,4 redone
		assert.isTrue(manager.isModified());
		manager.setUnmodified();
		manager.undo(); // 4 undone
		manager.undo(); // 3,2,1 undone
		assert.isTrue(manager.isModified());
		manager.redo(); // 1 redone
		assert.isTrue(manager.isModified());
		manager.redo(); // 2,3,4 redone
		assert.isFalse(manager.isModified());
	}

	@test save_marker_merged_insignificant() {
		const manager = new UndoManager();
		manager.add(new UndoableMerge(0, 1));
		assert.isTrue(manager.isModified());
		manager.add(new UndoableMerge(1, 0));
		assert.isFalse(manager.isModified());
	}

	@test save_marker_saved_then_merged_insignificant() {
		const manager = new UndoManager();
		manager.add(new UndoableMerge(0, 1));
		assert.isTrue(manager.isModified());
		manager.setUnmodified();
		manager.add(new UndoableMerge(1, 0));
		assert.isTrue(manager.isModified());
	}

	@test replace() {
		const manager = new UndoManager();
		const undoable1 = new UndoableReplaceSpy();
		const undoable2 = new UndoableReplaceSpy();
		manager.add(undoable1);
		manager.add(undoable2);
		assert.isTrue(manager.canUndo());
		assert.isFalse(manager.canRedo());
		manager.undo();
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 0);
		assert.isFalse(manager.canUndo());
		assert.isTrue(manager.canRedo());
		manager.redo();
		assert.equal(undoable1.undoneCount, 0);
		assert.equal(undoable1.redoneCount, 0);
		assert.equal(undoable2.undoneCount, 1);
		assert.equal(undoable2.redoneCount, 1);
		assert.isTrue(manager.canUndo());
		assert.isFalse(manager.canRedo());
	}

	@test listener() {
		let count = 0;
		const manager = new UndoManager();
		manager.setListener(() => count++);
		assert.equal(count, 0);
		manager.add(new UndoableSpy());
		assert.equal(count, 1);
		manager.undo();
		assert.equal(count, 2);
		manager.redo();
		assert.equal(count, 3);
		manager.clear();
		assert.equal(count, 4);

		manager.add(new UndoableSpy());
		assert.equal(count, 5);
		manager.add(new UndoableInsignificantSpy());
		assert.equal(count, 6);
		manager.add(new UndoableInsignificantSpy());
		assert.equal(count, 7);
		manager.add(new UndoableSpy());
		assert.equal(count, 8);
		manager.undo();
		assert.equal(count, 9);
		manager.undo();
		assert.equal(count, 10);
		assert.isFalse(manager.canUndo());
	}
}
