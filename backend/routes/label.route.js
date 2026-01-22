const router = require("express").Router();
const { where, Op, fn, col } = require("sequelize");
const sequelize = require("../db/config/sequelize.config");
const { Label, Label_Tag, Expenses2 } = require("../db/models/associations");
const session = require("express-session");

//used Module/s:
//label mngnt
// loan
router.route("/fetchTable").get(async (req, res) => {
  try {
    const isFetch = await Label.findAll({
      include: [
        {
          model: Label_Tag,
          required: true,
        },
      ],
    });

    if (isFetch) {
      return res.json(isFetch);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

//used Module/s:
//label mngnt
router.route("/createLabel").post(async (req, res) => {
  try {
    const { labelName, subLabelName, tags, description, accounts } = req.body;

    const isExist = await Label.findOne({
      where: {
        label_name: labelName,
        sub_label_name: subLabelName,
      },
    });

    if (isExist) {
      return res.status(201).json();
    } else {
      const isCreated = await Label.create({
        label_name: labelName,
        sub_label_name: subLabelName,
        description: description,
      });

      if (isCreated) {
        const labelID = isCreated.id;
        for (const tagged of tags) {
          for (const account of accounts) {
            await Label_Tag.create({
              label_id: labelID,
              tag: tagged.value,
              account: account.value,
            });
          }
        }

        return res.status(200).json();
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

//used Module/s:
//label mngnt
router.route("/updateLabel").post(async (req, res) => {
  try {
    const { selectedTableId, labelName, subLabelName, tags, description } =
      req.body;

    const isExist = await Label.findOne({
      where: {
        label_name: labelName,
        sub_label_name: subLabelName,
        id: { [Op.ne]: selectedTableId },
      },
    });

    if (isExist) {
      return res.status(201).json();
    } else {
      const isCreated = await Label.update(
        {
          label_name: labelName,
          sub_label_name: subLabelName,
          description: description,
        },
        {
          where: {
            id: selectedTableId,
          },
        }
      );

      if (isCreated) {
        await Label_Tag.destroy({
          where: {
            label_id: selectedTableId,
          },
        });

        for (const tagged of tags) {
          await Label_Tag.create({
            label_id: selectedTableId,
            tag: tagged.value,
          });
        }

        return res.status(200).json();
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json("Error");
  }
});

module.exports = router;
