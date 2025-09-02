module.exports = {
  'accessory.search': async (client, params) => {
    // Set defaults for optional parameters
    const {
      page = 1,
      limit = 10,
      expand = 'services',
      roomId,
      roomName,
      search,
      manufacturer,
      model,
      online,
      virtual,
      serviceType,
      characteristicType,
      writable
    } = params;

    // Validate required parameters
    if (page < 1) {
      throw new Error('Page number must be 1 or greater.');
    }
    if (limit < 1) {
      throw new Error('Limit must be 1 or greater.');
    }
    if (expand && !['none', 'services', 'characteristics'].includes(expand)) {
      throw new Error('Expand parameter must be one of: none, services, characteristics');
    }

    // Step 1: Get room mapping if room name filtering is requested
    let targetRoomId = roomId;
    let roomFilter = null;
    
    if (roomName) {
      const roomsResponse = await client.callMethod('room.list');
      if (!roomsResponse.isSuccess) {
        return roomsResponse; // Propagate error
      }
      
      const rooms = roomsResponse.data.rooms;
      const matchingRoom = rooms.find(room => 
        room.name.toLowerCase().includes(roomName.toLowerCase())
      );
      
      if (matchingRoom) {
        targetRoomId = matchingRoom.id;
        roomFilter = `${roomName} (ID: ${matchingRoom.id})`;
      } else {
        // No matching room found, return empty result
        return {
          isSuccess: true,
          code: 0,
          message: 'Success',
          data: {
            accessories: [],
            total: 0,
            filtered: 0,
            page: page,
            limit: limit,
            expand: expand,
            appliedFilters: {
              roomFilter: `${roomName} (not found)`
            }
          }
        };
      }
    } else if (roomId) {
      roomFilter = `Room ID: ${roomId}`;
    }

    // Step 2: Get accessories with appropriate expansion
    // Use minimal expansion initially if we have complex filters
    const hasComplexFilters = serviceType || characteristicType || writable;
    const initialExpand = hasComplexFilters ? 'services,characteristics' : 
                         expand === 'characteristics' ? 'services,characteristics' :
                         expand === 'services' ? 'services' : '';

    const accessoryParams = initialExpand ? 
      { accessory: { list: { expand: initialExpand } } } :
      { accessory: { list: {} } };

    const allAccessoriesResponse = await client.callMethod('accessory.list', accessoryParams);
    if (!allAccessoriesResponse.isSuccess) {
      return allAccessoriesResponse; // Propagate error
    }

    let accessories = allAccessoriesResponse.data.accessories;
    const totalCount = accessories.length;

    // Step 3: Apply filters
    let appliedFilters = {};

    // Room filtering
    if (targetRoomId) {
      accessories = accessories.filter(acc => acc.roomId === targetRoomId);
      appliedFilters.roomFilter = roomFilter;
    }

    // Text search in accessory name
    if (search) {
      accessories = accessories.filter(acc => 
        acc.name.toLowerCase().includes(search.toLowerCase())
      );
      appliedFilters.searchFilter = search;
    }

    // Manufacturer filtering
    if (manufacturer) {
      accessories = accessories.filter(acc => 
        acc.manufacturer && acc.manufacturer.toLowerCase().includes(manufacturer.toLowerCase())
      );
      appliedFilters.manufacturerFilter = manufacturer;
    }

    // Model filtering
    if (model) {
      accessories = accessories.filter(acc => 
        acc.model && acc.model.toLowerCase().includes(model.toLowerCase())
      );
      appliedFilters.modelFilter = model;
    }

    // Online status filtering
    if (typeof online === 'boolean') {
      accessories = accessories.filter(acc => acc.online === online);
      appliedFilters.onlineFilter = online;
    }

    // Virtual device filtering
    if (typeof virtual === 'boolean') {
      accessories = accessories.filter(acc => acc.virtual === virtual);
      appliedFilters.virtualFilter = virtual;
    }

    // Service type filtering
    if (serviceType) {
      accessories = accessories.filter(acc => 
        acc.services && acc.services.some(service => 
          service.type && service.type.toLowerCase().includes(serviceType.toLowerCase())
        )
      );
      appliedFilters.serviceTypeFilter = serviceType;
    }

    // Characteristic type filtering
    if (characteristicType) {
      accessories = accessories.filter(acc =>
        acc.services && acc.services.some(service =>
          service.characteristics && service.characteristics.some(char =>
            char.control && char.control.type && 
            char.control.type.toLowerCase().includes(characteristicType.toLowerCase())
          )
        )
      );
      appliedFilters.characteristicTypeFilter = characteristicType;
    }

    // Writable characteristics filtering
    if (writable) {
      accessories = accessories.filter(acc =>
        acc.services && acc.services.some(service =>
          service.characteristics && service.characteristics.some(char =>
            char.control && char.control.write === true
          )
        )
      );
      appliedFilters.writableFilter = writable;
    }

    const filteredCount = accessories.length;

    // Step 4: Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedAccessories = accessories.slice(startIndex, endIndex);

    // Step 5: Calculate pagination navigation flags
    const hasNextPage = (page * limit) < filteredCount;
    const hasPreviousPage = page > 1;
    const totalPages = Math.ceil(filteredCount / limit);

    return {
      isSuccess: true,
      code: 0,
      message: 'Success',
      data: {
        accessories: paginatedAccessories,
        total: totalCount,
        filtered: filteredCount,
        page: page,
        limit: limit,
        hasNextPage: hasNextPage,
        hasPreviousPage: hasPreviousPage,
        totalPages: totalPages,
        expand: expand,
        appliedFilters: appliedFilters
      }
    };
  }
};