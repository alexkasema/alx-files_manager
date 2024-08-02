import { ObjectId } from 'mongodb';

const basicUtils = {
  // checks if mongo id is valid
  isValidId(id) {
    try {
      ObjectId(id);
    } catch (err) {
      return false;
    }
    return true;
  },
};

export default basicUtils;
