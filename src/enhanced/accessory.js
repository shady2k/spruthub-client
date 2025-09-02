module.exports = {
  'accessory.listPaged': async (client, params) => {
    const { page, limit } = params;
    if (page < 1) {
      throw new Error('Page number must be 1 or greater.');
    }
    if (limit < 1) {
      throw new Error('Limit must be 1 or greater.');
    }

    // Call the core method
    const allAccessoriesResponse = await client.callMethod('accessory.list');
    if (!allAccessoriesResponse.isSuccess) {
        return allAccessoriesResponse; // Propagate error
    }
    const allAccessories = allAccessoriesResponse.data.accessories;

    // Paginate the result
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginated = allAccessories.slice(startIndex, endIndex);

    return {
      isSuccess: true,
      code: 0,
      message: 'Success',
      data: {
        accessories: paginated,
        total: allAccessories.length,
        page: page,
        limit: limit
      }
    };
  }
};