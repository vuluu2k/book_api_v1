import product from '../models/product';
import category from '../models/category';
import { cloudinaryV2 } from '../utils/cloudinary';


class productController {
  async createProduct(req, res) {
    const { name, value, image, status, quantity, category, sub_category, options, profile, description } = req.body;

    if (!name || !value || !image || !status) {
      return res.json({ success: false, message: 'Bạn bỏ quên một số trường nhập bắt buộc' });
    }

    try {
      const image_response = await cloudinaryV2.uploader.upload(image, {
        upload_preset: 'book_v1',
        eager: { width: 640, height: 640, crop: 'pad' },
      });
      const newProduct = new product({
        name,
        value,
        status,
        quantity,
        category,
        image_id: image_response.public_id,
        image_link: image_response.eager[0].url,
        sub_category,
        options,
        profile,
        description,
      });

      await newProduct.save();

      res.json({ success: true, message: 'Tạo thành công!', product: newProduct });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
  }

  async getProduct(req, res) {
    const { product_id, name, value, status, category, sub_category, page_number = 1, page_size = 100 } = req.query;

    try {
      const listProduct = await product
        .find({
          $and: [
            (product_id && product_id !== String(null) && product_id !== String(undefined) && { _id: product_id }) || {},
            (name && name !== String(undefined) && { name: { $regex: name, $options: 'i' } }) || {},
            (value && value !== String(undefined) && { value }) || {},
            (status && status !== String(undefined) && { status }) || {},
            (category && category !== String(undefined) && { category }) || {},
            (sub_category && sub_category !== String(undefined) && { sub_category }) || {},
          ],
        })
        .limit(page_size * 1)
        .skip((page_number - 1) * page_size)
        .sort({ updatedAt: 'desc' });

      const productLength = await (await product.find({})).length;

      const page_entries = productLength / page_size;
      const page_totals = productLength;

      if (!listProduct) {
        return res.json({ success: false, message: 'Danh sách trống!' });
      }
      return res.json({
        success: true,
        message: 'Thành công tải lên danh sách',
        products: listProduct,
        page_size,
        page_number,
        page_entries,
        page_totals,
        dataSearch: {
          page_size,
          page_number,
          page_entries,
          page_totals,
          product_id,
          name,
          value,
          status,
          category,
          sub_category,
        },
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
  }

  async getProductInHome(req, res) {
    try {
      const categorys = await category.find({});
      const productHot = await product.find({}).sort({ cout_buy: 'desc' }).limit(18);
      const sp1 = await product.find({ category: categorys[0]?._id }).sort({ updatedAt: 'desc' }).limit(12);
      const sp2 = await product.find({ category: categorys[1]?._id  }).sort({ updatedAt: 'desc' }).limit(12);
      const sp3 = await product.find({ category: categorys[2]?._id  }).sort({ updatedAt: 'desc' }).limit(6);
      const sp4 = await product.find({ category: categorys[3]?._id  }).sort({ updatedAt: 'desc' }).limit(6);
      const sp5 = await product.find({ category: categorys[4]?._id  }).sort({ updatedAt: 'desc' }).limit(18);

      res.json({ success: true, message: 'Tải Home thành công', hot: productHot, sp1, sp2, sp3, sp4, sp5,name1:categorys[0]?.name_vi,name2:categorys[1]?.name_vi,name3:categorys[2]?.name_vi,name4:categorys[3]?.name_vi,name5:categorys[4]?.name_vi });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
  }

  async editProduct(req, res) {
    const { product_id, name, value, image, status, quantity, category, sub_category, options, profile, description } = req.body;

    if (!product_id) {
      return res.json({ success: false, message: 'Có lỗi về mặt dữ liệu khi bắn lên Server' });
    }

    try {
      const product_with_id = await product.findById({ _id: product_id });
      const image_response = await cloudinaryV2.uploader.upload(image, {
        public_id: product_with_id.image_id,
        overwrite: true,
        eager: { width: 640, height: 640, crop: 'pad' },
      });

      let product_change = {
        name,
        value,
        status,
        quantity,
        category,
        image_id: image_response.public_id,
        image_link: image_response.eager[0].url,
        sub_category,
        options,
        profile,
        description,
      };

      const editProduct = await product.findOneAndUpdate({ _id: product_id }, product_change, { new: true });
      if (!editProduct) {
        return res.json({ success: false, message: 'Cập nhật thất bại' });
      }
      res.json({ success: true, message: 'Cập nhật thành công', product: editProduct });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
  }

  async deleteProduct(req, res) {
    const { id } = req.params;
    if (!id) {
      return res.json({ success: false, message: 'Mã sản phẩm không tồn tại' });
    }

    try {
      const deleteProduct = await product.findOneAndDelete({ _id: id });

      if (!deleteProduct) {
        return res.json({ success: false, message: 'Sản phẩm không tồn tại' });
      }

      await cloudinaryV2.uploader.destroy(`${deleteProduct.image_id}`);
      res.json({ success: true, message: 'Xóa thành công', product: deleteProduct });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
  }
}

export default new productController();
