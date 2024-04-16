const extractDescription = (itemDescription) => {
  if (!itemDescription || itemDescription.type !== "Föremålsbeskrivning") {
    return "Beskrivning saknas";
  }
  if (itemDescription["@value"]) {
    // Structured description
    return itemDescription["@value"];
  } else if (itemDescription.desc || itemDescription.desc.value) {
    // Unstructured description
    return itemDescription.desc || itemDescription.desc.value;
  } else {
    return "Beskrivning saknas";
  }
};

const BASE_URL = 'https://kulturarvsdata.se/ksamsok/api';
const categories = ['jewelry', 'ceramics', 'weapons'];

export default
  {
    async fetchData(url) {
      try {
        const response = await fetch(url, { headers: { 'Accept': 'application/json-ld' } });

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        return await response.json();
      }
      catch (error) {
        console.error('Error fetching data:', error.message);
        throw error;
      }
    },

    async fetchItems(url) {
      try {
        const data = await this.fetchData(url); // Get data as JSON

        // If data is null or no items were found, throw an error.
        if (data == null || data.result.totalHits <= 0) {
          throw new Error('No items found');
        }

        const fetchIndicesCount = 9; // Amount of total items (indices) to fetch.
        const randomIndices = []; // Array to store the random incides

        // Fill the array with random indices. Ensuring no duplicates.
        while (randomIndices.length < fetchIndicesCount) {
          const randomIndex = Math.floor(Math.random() * data.result.totalHits); // Get random index based on total hits.

          // Push the index into the array if it doesn't already exist.
          if (!randomIndices.includes(randomIndex)) randomIndices.push(randomIndex);
        }

        // ...
        const fetchPromises = randomIndices.map(async index => {
          const fetchUrl = `${url}&startRecord=${index}&maximumRecords=1`;
          const fetchData = await this.fetchData(fetchUrl);
          console.log('Fetched record JSON data:', fetchData.result.records[0]); // <-- Print JSON data directly
          return fetchData.result.records[0];
        });

        const fetchedRecords = await Promise.all(fetchPromises); // Wait for all fetch requests to complete

        // Process fetched records
        const items = fetchedRecords.map(record => {
          // Extracting the necessary elements from the record.
          const graph = record.record["@graph"];
          const itemName = graph.find(item => item["@type"] === "ns1:ItemName" || item["@type"] === "ItemName"); const thumbnail = graph.find(item => item["@type"] === "ns1:Image" || item["@type"] === "Image");
          const itemDescription = graph.find(item => item["@type"] === "ns1:ItemDescription" || item["@type"] === "ItemDescription");
          const context = graph.find(obj => obj["@type"] === "ns1:Context");

          // Extracting specific properties from those elements.
          const itemNameText = itemName ? itemName["ns1:name"] || itemName["name"] : null;
          const thumbnailSource = thumbnail ? (thumbnail.lowresSource || thumbnail.thumbnailSource) : null;
          const descText = extractDescription(itemDescription);
          // Extract data about context if object exists
          const contextLabel = context ? context.contextLabel : null;
          const fromTime = context ? context.fromTime : null;
          let toTime = context ? context.toTime : null;

          // If fromTime and toTime have the same value YYYY-mm-dd, return null in
          if (fromTime === toTime) {
            toTime = null;
          }

          // Creating a new object with the extracted properties and returning it
          return {
            id: record.record["@id"],
            itemName: itemNameText,
            image: thumbnailSource,
            description: descText,
            context: {
              contextLabel,
              fromTime,
              toTime
            }
          };
        });

        console.log('Random items:', items);
        return items;

      }
      catch (error) {
        console.error('Error fetching items:', error.message);
        throw error;
      }
    },

    /** Category 1 */
    async getJewelry() {
      const url = `${BASE_URL}?method=search&version=1.1&query=itemType=%22objekt%2Ff%C3%B6rem%C3%A5l%22%20AND%20serviceOrganization=smvk-vkm%20AND%20thumbnailExists%3Dj`;
      return await this.fetchItems(url);
    },

    /** Category 2 */
    async getCeramics() {
      const url = `${BASE_URL}?method=search&version=1.1&query=itemClassName%3D%22Lekar%20och%20spel%20(OU%20524)%22%20AND%20itemType%3D%22objekt%2Ff%C3%B6rem%C3%A5l%22%20AND%20thumbnailExists%3Dj%20NOT%20text%3D%22docksk%C3%A5p%22%20AND%20produce_century%3D1800`;
      console.log(`trying ceramics.....`)
      return await this.fetchItems(url);
    },

    /** Category 3 */
    async getWeapons() {
      const url = `${BASE_URL}?method=search&version=1.1&query=itemType%3D%22konstverk%22%20AND%20thumbnailExists%3Dj%20AND%20create_fromTime%3C=1800%20AND%20create_toTime%3E=1600%20AND%20itemKeyWord%3Dportr%C3%A4tt`;
      return await this.fetchItems(url);
    },

    /** Random category from category 1-3 */
    async getRandom() {
      try {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        switch (randomCategory) {
          case 'jewelry':
            return await this.getJewelry();
          case 'ceramics':
            return await this.getCeramics();
          case 'weapons':
            return await this.getWeapons();
          default:
            throw new Error('Invalid category');
        }
      }
      catch (error) {
        console.error('Error getting random items:', error.message);
        throw error;
      }
    }
  }