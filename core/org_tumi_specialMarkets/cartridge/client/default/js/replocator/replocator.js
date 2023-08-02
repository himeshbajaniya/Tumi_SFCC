module.exports = function () {
    // on change of replocator dropdown
    $('#replocator_region_selector').on('change', function (e) {
        var selectedOption = $(this)[0].value;
        var allRegions = $(this).closest('.replocator_selector').find('.replocator_regions .replocator_region');
        var details = $(this).closest('.replocator_selector').find('.replocator_regions .replocator_region.'+selectedOption)
        allRegions.hide();
        details.show();
    });
}