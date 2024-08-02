import { ObjectId } from 'mongodb';
import userUtils from '../utils/user';
import basicUtils from '../utils/basic';
import fileUtils from '../utils/file';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  // should create a new file in DB and in disk.
  static async postUpload(req, res) {
    const { userId } = await userUtils.getUserIdAndKey(req);

    if (!basicUtils.isValidId(userId)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await userUtils.getUser({
      _id: ObjectId(userId),
    });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { error: validationError, fileParams } = await fileUtils
      .validateBody(req);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }
    if (fileParams.parentId !== 0 && !basicUtils.isValidId(
      fileParams.parentId,
    )) {
      return res.status(400).json({ error: 'Parent not found' });
    }

    const { error, code, newFile } = await fileUtils.saveFile(
      userId,
      fileParams,
      FOLDER_PATH,
    );

    if (error) {
      return res.status(code).json(error);
    }

    return res.status(201).json(newFile);
  }
}

export default FilesController;
