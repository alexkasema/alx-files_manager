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

  // should retrieve the file document based on the ID
  static async getShow(req, res) {
    const fileId = req.params.id;

    const { userId } = await userUtils.getUserIdAndKey(req);

    const user = await userUtils.getUser({
      _id: ObjectId(userId),
    });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    if (!basicUtils.isValidId(fileId) || !basicUtils.isValidId(userId)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const result = await fileUtils.getFile({
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    });

    if (!result) return res.status(404).json({ error: 'Not found' });

    const file = fileUtils.processFile(result);

    return res.status(200).json(file);
  }

  /**
   * should retrieve all users file documents for a specific
   * parentId and with pagination
   */
  static async getIndex(req, res) {
    const { userId } = await userUtils.getUserIdAndKey(req);

    const user = await userUtils.getUser({
      _id: ObjectId(userId),
    });

    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    let parentId = req.query.parentId || '0';

    if (parentId === '0') parentId = 0;

    let page = Number(req.query.page) || 0;
    if (Number.isNaN(page)) page = 0;

    if (parentId !== 0 && parentId !== '0') {
      if (!basicUtils.isValidId(parentId)) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      parentId = ObjectId(parentId);

      const folder = await fileUtils.getFile({
        _id: ObjectId(parentId),
      });

      if (!folder || folder.type !== 'folder') {
        return res.status(200).json([]);
      }
    }

    const pipeline = [
      { $match: { parentId } },
      { $skip: page * 20 },
      {
        $limit: 20,
      },
    ];

    const fileCursor = await fileUtils.getFilesOfParentId(pipeline);

    const fileList = [];

    await fileCursor.forEach((doc) => {
      const file = fileUtils.processFile(doc);
      fileList.push(file);
    });

    return res.status(200).json(fileList);
  }
}

export default FilesController;
