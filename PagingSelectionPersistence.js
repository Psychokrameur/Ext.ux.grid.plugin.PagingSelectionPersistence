/**
 * Grid PagingSelectionPersistence plugin
 * 
 * Maintains row selection state when moving between pages of a paginated grid
 * 
 * Public Methods: getPersistedSelection() - retrieve the array of selected
 * records across all pages clearPersistedSelection() - deselect records across
 * all pages
 * 
 * {@link http://www.sencha.com/forum/showthread.php?263871-Selection-of-records-over-multiple-pages-in-a-grid-Select-All}
 * 
 * Antoine Verron :
 * 
 * <pre> 
 * - add getPersistedSelection method to the grid 
 * - put selection and selected in instance attribute instead of class attribute
 * </pre>
 * 
 * @class Ext.ux.grid.plugin.PagingSelectionPersistence
 * @extends Ext.AbstractPlugin
 * @author Bill Dami, Antoine Verron
 * @date December 20th, 2011
 * 
 */
Ext.define('Ext.ux.grid.plugin.PagingSelectionPersistence', {
    alias: 'plugin.pagingselectpersist',
    extend: 'Ext.plugin.Abstract',
    pluginId: 'pagingselectpersist',

    init: function(grid) {
        var me = this;

        //array of selected records
        me.selection = [];
        //hash map of record id to selected state
        me.selected = {};

        me.grid = grid;
        me.selModel = me.grid.getSelectionModel();
        me.isCheckboxModel = me.selModel.$className == 'Ext.selection.CheckboxModel';
        me.origOnHeaderClick = me.selModel.onHeaderClick;
        me.bindListeners();

        // Psycho
        me.grid.getPersistedSelection = Ext.bind(me.getPersistedSelection, me);
        me.grid.setPersistedSelection = Ext.bind(me.setPersistedSelection, me);
        me.grid.deslectAllPersistedSelection = Ext.bind(me.deselectAll, me);
    },

    clearSelection: function() {
        this.selection = [];
        this.selected = {};
    },

    destroy: function() {
        this.clearSelection();
        this.disable();
    },

    enable: function() {
        var me = this;

        if (me.disabled && me.grid) {
            me.grid.getView().on('refresh', me.onViewRefresh, me);
            me.selModel.on({
                'select': 'onRowSelect',
                'deselect': 'onRowDeselect',
                scope: me
            });

            if (me.isCheckboxModel) {
                //For CheckboxModel, we need to detect when the header deselect/select page checkbox
                //is clicked, to make sure the plugin's selection array is updated. This is because Ext.selection.CheckboxModel
                //interally supresses event firings for selectAll/deselectAll when its clicked
                me.selModel.onHeaderClick = function(headerCt, header, e) {
                    var isChecked = header.el.hasCls(Ext.baseCSSPrefix + 'grid-hd-checker-on');
                    me.origOnHeaderClick.apply(me, arguments);

                    if (isChecked) {
                        me.onDeselectPage();
                    }
                    else {
                        me.onSelectPage();
                    }
                };
            }
        }

        me.callParent();
    },

    disable: function() {
        var me = this;

        if (me.grid) {
            me.grid.getView().un('refresh', me.onViewRefresh, me);
            me.selModel.un('select', me.onRowSelect, me);
            me.selModel.un('deselect', me.onRowDeselect, me);
            me.selModel.onHeaderClick = me.origOnHeaderClick;
        }

        me.callParent();
    },

    bindListeners: function() {
        var disabled = this.disabled;

        this.disable();

        if (!disabled) {
            this.enable();
        }
    },

    onViewRefresh: function(view, eOpts) {
        var me = this, //
        store = me.grid.getStore(), sel = [], hdSelectState, rec, i;
        me.ignoreChanges = true;

        for (i = store.getCount() - 1; i >= 0; i--) {
            rec = store.getAt(i);

            if (me.selected[rec.getId()]) {
                sel.push(rec);
            }
        }

        me.selModel.select(sel, false);

        if (me.isCheckboxModel) {
            //For CheckboxModel, make sure the header checkbox is correctly
            //checked/unchecked when the view is refreshed depending on the 
            //selection state of the rows on that page (workaround for possible bug in Ext 4.0.7?)
            hdSelectState = me.selModel.selected.getCount() === me.grid.getStore().getCount();
            me.selModel.toggleUiHeader(hdSelectState);
        }

        me.ignoreChanges = false;
    },

    onRowSelect: function(sm, rec, idx, eOpts) {
        //        console.debug('onRowSelect', sm, rec, idx, this.ignoreChanges, this.selection, this.selected[rec.getId()]);

        if (this.ignoreChanges === true) {
            return;
        }

        this.selectRecord(rec);
    },

    onRowDeselect: function(sm, rec, idx, eOpts) {
        var me = this, i;

        //        console.debug('onRowDeselect', sm, rec, idx, this.ignoreChanges, this.selection, this.selected[rec.getId()]);

        if (me.ignoreChanges === true) {
            return;
        }

        if (me.selected[rec.getId()]) {
            for (i = me.selection.length - 1; i >= 0; i--) {
                if (me.selection[i].getId() == rec.getId()) {
                    me.selection.splice(i, 1);
                    me.selected[rec.getId()] = false;
                    break;
                }
            }
        }
    },

    onSelectPage: function() {
        var sel = this.selModel.getSelection(), len = this.selection.length, i;

        for (i = 0; i < sel.length; i++) {
            //alert(i + sel[i]);
            this.onRowSelect(this.selModel, sel[i]);
        }

        if (len !== this.selection.length) {
            this.selModel.fireEvent('selectionchange', this.selModel, [], {});
        }
    },

    onDeselectPage: function() {
        var store = this.grid.getStore(), len = this.selection.length, i;

        for (i = store.getCount() - 1; i >= 0; i--) {
            this.onRowDeselect(this.selModel, store.getAt(i));
        }

        if (len !== this.selection.length) {
            this.selModel.fireEvent('selectionchange', this.selModel, [], {});
        }
    },

    setPersistedSelection: function(records) {
        this.selectRecords(records);

        this.selModel.select(records, true, true);
    },

    getPersistedSelection: function() {
        return [].concat(this.selection);
    },

    deselectAll: function(suppressEvent) {
        this.selModel.deselectAll();
        this.clearSelection();
    },

    getCount: function() {
        return this.selection.length;
    },

    // private
    onSelectionClear: function() {
        if (!this.ignoreSelectionChanges) {
            // selection cleared by user
            // also called internally when the selection replaces the old selection
            this.selection = [];
            this.selected = {};
        }
    }, // end onSelectionClear 

    clearPersistedSelection: function() {
        var changed = this.selection.length > 0;

        this.selection = [];
        this.selected = {};
        this.onViewRefresh();

        if (changed) {
            this.selModel.fireEvent('selectionchange', this.selModel, [], {});
        }
    },

    /**
     * Selects all the rows in the grid, including those on other page Be very
     * careful using this on very large datasets
     */
    selectAll: function() {
        var storeB = this.grid.getStore();
        storeB.suspendEvents();
        //alert(storeB.getTotalCount());

        storeB.load({
            params: {
                start: 0,
                limit: storeB.getTotalCount()
            },
            callback: function(records, operation, success) {
                if (records.length > 0) { // Issue is here: Records returns as NULL 
                    //alert('Num Records: ' + records.length);

                    this.selectRecords(records);

                    storeB.resumeEvents();
                    this.onViewRefresh();

                    /*
                     * this.selection = storeB.data.items.slice(0);
                     * this.selected = {}; for (var i = this.selection.length -
                     * 1; i >= 0; i--) { this.selected[this.selection[i].id] =
                     * true; };
                     */
                }
                else {
                    console.warn('No records');
                }
            },
            scope: this
        });

        this.selectRecord(rec);
    },

    countAll: function() {
        var storeA = this.grid.getStore();
        // <debug>
        console.info('store count ' + storeA.getCount());
        console.info('store count ' + storeA.getTotalCount());
        // </debug>

        return storeA.getCount();
    },

    privates: {
        selectRecords: function(records) {
            records = records || [];
            if (!Ext.isArray(records)) {
                records = [
                    records
                ];
            }

            for (var i = records.length - 1; i >= 0; i--) {
                this.selectRecord(records[i]);
            }
        },
        selectRecord: function(record) {
            var id = record.getId();
            if (!this.selected[id]) {
                this.selection.push(record);
                this.selected[id] = true;
            }
        }
    }

});