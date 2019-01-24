import React, { Component } from 'react';
import { 
    View, 
    Animated,
    PanResponder,
    Dimensions, 
    LayoutAnimation,
    UIManager
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 200;

class Deck extends Component {
static defaultProps = {
    onSwipeRight: () => {},
    onSwipeLeft: () => {}
}

    constructor(props) {
        super(props);

        // Build the function for actually animating the card
        // both when it starts and when you release the action
        const position = new Animated.ValueXY();
        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (event, gesture) => {
                position.setValue({ x: gesture.dx , y: gesture.dy });
            },
            onPanResponderRelease: (event, gesture) => {
                    if (gesture.dx > SWIPE_THRESHOLD) {
                        this.forceSwipe('right');
                    } else if (gesture.dx < -SWIPE_THRESHOLD) {
                        this.forceSwipe('left');
                    } else {
                        this.resetPosition();
                        }
                }
        });

        this.state = { panResponder, position, index: 0 };
    }

    // If you get a new set of Data, compare the next 
    // set of DATA props to the first
    // if it is not exactly the same, reset the index
    // so that the Deck list resets back to 0 (as you would expect)
    componentWillReceiveProps(nextProps) {
        if (nextProps.data !== this.props.data) {
            this.setState({ index: 0 })
        };
    }

    // Adding a subtle animation on the vertical 
    // advancing of the deck (after swipe)
    componentWillUpdate() {
        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
        LayoutAnimation.easeInEaseOut();
    }
    
    // Making sure that once the card is swiped far enough, 
    // it continues and completes the advance after you release
    forceSwipe(direction) {
        const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
        Animated.timing(this.state.position, {
            toValue: { x, y: 0 },
            duration: SWIPE_OUT_DURATION
        }).start(() => this.onSwipeComplete(direction));
    }

    // Setting the direction which also tells us the choice the user
    // made, left or right. Left likely to be in the future associated
    // with a no callback and right associated with a yes callback
    onSwipeComplete(direction) {
        const { onSwipeLeft, onSwipeRight, data } = this.props;
        const item = data[this.state.index];

        direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
        this.state.position.setValue({ x:0, y:0 });
        this.setState({ index: this.state.index + 1 });
    }

    // Set the position of the next card (after swipe) back to 0,0
    // otherwise it would take the position of the previously swiped card
    resetPosition() {
        Animated.spring(this.state.position, {
            toValue: { x: 0, y: 0 }
        }).start();
    }

    // Set the rotation and distance for rotation
    getCardStyle() {
        const { position } = this.state;
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
            outputRange: ['-120deg', '0deg', '120deg']
        });

        // Spread the props over the getLayout method 
        // which is the menthod which actually applies 
        // the animation to the item/View
        return { 
            ...position.getLayout(),
        transform: [{ rotate }]
        };
    }

    renderCards() {
        if (this.state.index >= this.props.data.length) {
            return this.props.renderNoMoreCards();
        }

       return this.props.data.map((item, i) => {
           if (i < this.state.index) { return null; }

            if (i === this.state.index) {
                return (
                    <Animated.View
                    key={item.id}
                    style={[this.getCardStyle(), styles.cardStyle]}
                    {...this.state.panResponder.panHandlers}
                    >
                        {this.props.renderCard(item)}
                    </Animated.View>
                );
            }

            return (
                <Animated.View
                key={item.id}
                style={[styles.cardStyle, { top: 20 * (i - this.state.index) }]}
                >
                    {this.props.renderCard(item)}
                </Animated.View>
            );
        }).reverse();
    }

    render() {
        return (
            <View>
                {this.renderCards()}
            </View>     
        );
    };
}

const styles = {
    cardStyle: {
        position: 'absolute',
        width: SCREEN_WIDTH,
        marginTop: 50
    }
};

export default Deck;
