/**
 * ScandiPWA - Progressive Web App for Magento
 *
 * Copyright © Scandiweb, Inc. All rights reserved.
 * See LICENSE for license details.
 *
 * @license OSL-3.0 (Open Software License ("OSL") v. 3.0)
 * @package scandipwa/base-theme
 * @link https://github.com/scandipwa/base-theme
 */

import { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { CartDispatcher } from 'Store/Cart';
import { WishlistDispatcher } from 'Store/Wishlist';
import { showNotification } from 'Store/Notification';
import { ProductType } from 'Type/ProductList';
import MyAccountMyWishlist from './MyAccountMyWishlist.component';

export const mapStateToProps = state => ({
    isLoading: state.WishlistReducer.isLoading,
    wishlistItems: state.WishlistReducer.productsInWishlist
});

export const mapDispatchToProps = dispatch => ({
    showNotification: (type, message) => dispatch(showNotification(type, message)),
    addProductToCart: options => CartDispatcher.addProductToCart(dispatch, options),
    removeFromWishlist: options => WishlistDispatcher.removeItemFromWishlist(dispatch, options)
});

export class MyAccountMyWishlistContainer extends PureComponent {
    static propTypes = {
        addProductToCart: PropTypes.func.isRequired,
        showNotification: PropTypes.func.isRequired,
        removeFromWishlist: PropTypes.func.isRequired,
        wishlistItems: PropTypes.objectOf(ProductType).isRequired
    };

    containerProps = () => ({
        isWishlistEmpty: this.getIsWishlistEmpty()
    });

    containerFunctions = () => ({
        removeAll: this.removeAll,
        addAllToCart: this.addAllToCart,
        getParameters: this.getParameters
    });

    getIsWishlistEmpty = () => {
        const { wishlistItems } = this.props;

        return Object.entries(wishlistItems).length <= 0;
    };

    getConfigurableVariantIndex = (sku, variants) => Object.keys(variants).find(i => variants[i].sku === sku);

    getParameters = (sku, item) => {
        const { variants, configurable_options } = item;

        const options = Object.keys(configurable_options) || [];
        const configurableVariantIndex = this.getConfigurableVariantIndex(sku, variants);

        const { attributes = {} } = variants[configurableVariantIndex];
        const parameters = Object.entries(attributes).reduce((acc, [code, { attribute_value }]) => {
            if (!options.includes(code)) return acc;

            return {
                ...acc,
                [code]: [attribute_value]
            };
        }, {});

        return parameters;
    };

    addItemToCart = (sku, item) => {
        const { addProductToCart } = this.props;
        const {
            item_id, type_id, variants, quantity
        } = item;

        const configurableVariantIndex = this.getConfigurableVariantIndex(sku, variants);
        const product = type_id === 'configurable'
            ? {
                ...item,
                configurableVariantIndex
            }
            : item;

        return addProductToCart({ product, quantity }).then(() => this.removeItem(item_id, sku));
    };

    addAllToCart = () => {
        const { wishlistItems } = this.props;

        const promises = Object.entries(wishlistItems)
            .map(([sku, item]) => this.addItemToCart(sku, item));

        Promise.all(promises)
            .then(() => this.showSuccessNotification('Products added to cart'))
            .catch(() => this.showErrorNotification());
    };

    removeAll = () => {
        const { wishlistItems } = this.props;
        const promises = Object.entries(wishlistItems)
            .map(([sku, { item_id }]) => this.removeItem(item_id, sku));

        Promise.all(promises)
            .then(() => this.showSuccessNotification('Wishlist cleared'))
            .catch(() => this.showErrorNotification());
    };

    removeItem = (item_id, sku) => {
        const { removeFromWishlist } = this.props;
        removeFromWishlist({ item_id, sku, noMessages: true });
    };

    showSuccessNotification = (message) => {
        const { showNotification } = this.props;
        showNotification('success', message);
    };

    showErrorNotification = (message = 'Something went wrong') => {
        const { showNotification } = this.props;
        showNotification('error', message);
    };

    render() {
        return (
            <MyAccountMyWishlist
              { ...this.props }
              { ...this.containerProps() }
              { ...this.containerFunctions() }
            />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MyAccountMyWishlistContainer);
