import { UndoableEdit } from "./UndoableEdit";

/**
 * The UndoManager keeps track of all editables.
 */
export class UndoManager {
    private edits: UndoableEdit[] = [];

    private position = 0;

    private unmodifiedPosition = 0;

    private limit: number;

    private listener: null | (() => void) = null;

    /**
     * Create a new UndoManager
     *
     * @param limit The maximum amount of editables to remember
     */
    public constructor(limit = 100) {
        this.limit = limit;
    }

    /**
     * The listener will be called when changes have been done (adding an edit, or undoing/redoing it)
     *
     * @param listener The new callback or null to remove the existing one.
     */
    public setListener(listener: null | (() => void)) {
        this.listener = listener;
    }

    /**
     * Test if there is anything to be saved
     */
    public isModified() {
        if (this.unmodifiedPosition === -1) return true;
        if (this.position === this.unmodifiedPosition) return false;
        if (this.edits.length <= this.unmodifiedPosition) return true;
        let from = this.testUndo(this.unmodifiedPosition);
        from = from === false ? this.unmodifiedPosition : from + 1;
        let to = this.testRedo(this.unmodifiedPosition);
        to = to === false ? this.unmodifiedPosition + 1 : to - 1;
        return this.position < from || this.position > to;
    }

    /**
     * Mark the point when the data has been saved.
     */
    public setUnmodified() {
        this.unmodifiedPosition = this.position;
    }

    /**
     * Get the maximum amount of editables to remember
     */
    public getLimit(): number {
        return this.limit;
    }

    /**
     * Set the maximum amount of editables to remember.
     * The new limit will be applied instantly.
     *
     * @param value The maximum amount of editables to remember
     */
    public setLimit(value: number): void {
        this.applyLimit((this.limit = value));
    }

    /**
     * Clear all edits
     */
    public clear(): void {
        this.edits.length = 0;
        this.position = 0;
        this.unmodifiedPosition = 0;
        this.listener?.();
    }

    private applyLimit(limit: number) {
        const diff = this.edits.length - limit;
        if (diff > 0) {
            this.position = Math.max(0, this.position - diff);
            if (this.unmodifiedPosition !== -1) this.unmodifiedPosition = Math.max(0, this.unmodifiedPosition - diff);
            this.edits.splice(0, diff);
        }
    }

    /**
     * Test to see the new position after an undo would happen.
     *
     * @param position The start position
     * @return False if no significant edit can be undone.
     * Otherwise the new position.
     */
    private testUndo(position: number): number | false {
        for (let i = position - 1; i >= 0; i--) {
            if (this.edits[i].isSignificant()) return i;
        }
        return false;
    }

    /**
     * @returns true if there is anything to be undone (only significant edits count)
     */
    public canUndo(): boolean {
        return this.testUndo(this.position) !== false;
    }

    /**
     * Undo the last significant edit.
     * This will undo all insignificant edits up to the edit to be undone.
     *
     * @throws Error if no edit can be undone.
     */
    public undo(): void {
        const newPosition = this.testUndo(this.position);
        if (newPosition === false) throw new Error("Cannot undo");
        while (this.position > newPosition) {
            const next = this.edits[--this.position];
            next.undo();
        }
        this.listener?.();
    }

    /**
     * Test to see the new position after an redo would happen.
     *
     * @param position The start position
     * @return False if no significant edit can be redone.
     * Otherwise the new position.
     */
    private testRedo(position: number): number | false {
        for (let i = position; i < this.edits.length; i++) {
            if (this.edits[i].isSignificant()) return i + 1;
        }
        return false;
    }

    /**
     * @returns true if there is anything to be redone (only significant edits count)
     */
    public canRedo(): boolean {
        return this.testRedo(this.position) !== false;
    }

    /**
     * Redo the next significant edit.
     * This will redo all insignificant edits up to the edit to be redone.
     *
     * @throws Error if no edit can be redone.
     */
    public redo(): void {
        const newPosition = this.testRedo(this.position);
        if (newPosition === false) throw new Error("Cannot redo");
        while (this.position < newPosition) {
            const next = this.edits[this.position++];
            next.redo();
        }
        this.listener?.();
    }

    /**
     * Add a new edit. Will try to merge or replace existing edits.
     *
     * @param edit The new edit to add.
     */
    public add(edit: UndoableEdit) {
        if (this.edits.length > this.position) this.edits.length = this.position;

        if (this.edits.length === 0 || this.unmodifiedPosition === this.edits.length) this.edits.push(edit);
        else {
            const last = this.edits[this.edits.length - 1];

            if (!last.merge(edit)) {
                if (edit.replace(last)) this.edits.pop();
                this.edits.push(edit);
            }
        }

        this.applyLimit(this.limit);
        this.position = this.edits.length;
        if (this.unmodifiedPosition >= this.position) this.unmodifiedPosition = -1;
        this.listener?.();
    }
}
