/* eslint-disable @typescript-eslint/no-unused-vars */

/**
 * The base class for undoables
 */
export abstract class UndoableEdit {
    /**
     * This action reverts the changes of the edit.
     */
    public abstract undo(): void;

    /**
     * This action re-applies the changes of the edit.
     */
    public abstract redo(): void;

    /**
     * Try to merge a new edit into an existing one. This can be used to merge smaller edits into larger edits.
     * For example a text editor can merge multiple changes into one, rather than having one edit per character change.
     *
     * @param edit The new edit
     * @returns true if the edit was merged, false otherwise
     */
    public merge(edit: UndoableEdit): boolean {
        return false;
    }

    /**
     * Try to replace an existing edit with a new one
     *
     * @param edit The new edit
     * @returns true if this edit should be replaced with the new one, false otherwise
     */
    public replace(edit: UndoableEdit): boolean {
        return false;
    }

    /**
     * A significant edit is worthy to be saved and to be displayed to the user as undoable.
     * A typical insignificant edit would be if two edits got merged into one, ending up with the original.
     * Another example is when selection changes have been done, which don't change the data.
     *
     * @return true if the edit was significant
     */
    public isSignificant(): boolean {
        return true;
    }
}
