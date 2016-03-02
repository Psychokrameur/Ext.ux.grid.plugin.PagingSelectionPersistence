# Ext.ux.grid.plugin.PagingSelectionPersistence
Grid PagingSelectionPersistence plugin

Maintains row selection state when moving between pages of a paginated grid

Public Methods: getPersistedSelection() - retrieve the array of selected
records across all pages clearPersistedSelection() - deselect records across
all pages

{@link http://www.sencha.com/forum/showthread.php?263871-Selection-of-records-over-multiple-pages-in-a-grid-Select-All}

Antoine Verron :

<pre> 
- add getPersistedSelection method to the grid 
- put selection and selected in instance attribute instead of class attribute
</pre>

@class Ext.ux.grid.plugin.PagingSelectionPersistence
@extends Ext.AbstractPlugin
@author Bill Dami, Antoine Verron
@date December 20th, 2011
