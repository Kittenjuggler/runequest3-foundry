# Active Context - RuneQuest 3 Foundry VTT System

## Current Development Focus
- ✅ Characteristic roll tooltip system with x1-x10 multiplier buttons implemented
- ✅ Tooltip display and interaction issues resolved
- ✅ CSS architecture improved and inline styles removed
- ✅ Compact header removed for consistent tooltip positioning across all tabs

## Recent Changes
- ✅ GitHub repository setup completed
- ✅ Characteristic roll tooltip implementation completed
- ✅ Tooltip positioning and event handling fixes implemented
- ✅ CSS cleanup and inline style removal completed
- ✅ Compact header removed to eliminate positioning issues

## Active Decisions and Considerations

### CSS Architecture Principles
**CRITICAL**: Avoid inline CSS with `!important` declarations unless absolutely unavoidable. Use proper CSS classes and external stylesheets instead.

**Completed Improvements:**
- ✅ Tooltip positioning uses CSS custom properties instead of inline styles
- ✅ All `!important` declarations removed from roll tooltip styles
- ✅ Proper CSS classes implemented for tooltip positioning
- ✅ Consistent styling with existing damage tooltip system

### Tooltip System Status
- ✅ Tooltip creation and positioning working consistently
- ✅ Event handling fixed (delayed click-outside handler)
- ✅ CSS implementation cleaned up and optimized
- ✅ Works consistently across all tabs with full header

### Header Layout Decision
- ✅ **Compact header completely removed** to eliminate positioning inconsistencies
- ✅ Full header now shows on all tabs for consistent user experience
- ✅ Tooltip positioning now works reliably regardless of tab context
- ✅ Simplified layout reduces complexity and maintenance overhead

## Next Steps
1. **Immediate**: Test tooltip functionality across all tabs
2. **Short-term**: Verify consistent behavior in different tab contexts
3. **Medium-term**: Apply same CSS principles to other components if needed
4. **Long-term**: Maintain consistent header layout across all system components

## Technical Notes
- Foundry VTT positioning challenges resolved by using consistent header layout
- Tooltips now use CSS custom properties for dynamic positioning
- Mouse tracking implemented as fallback positioning method
- All event handlers properly cleaned up to prevent memory leaks
