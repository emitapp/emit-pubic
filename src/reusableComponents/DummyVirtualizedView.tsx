import React from 'react';
import { FlatList, FlatListProps } from 'react-native';

/**
 * This view is for cases where You are trying to render a Flatlist in an environment that is 
 * also scrolling. Normally, you'd use something like a ScrollView, but that messes with the Flatlist's 
 * ability to detect height and defer rendering and recycling. This is a workaround;
 * simply use this instead of the scrollview. Source: https://stackoverflow.com/a/63205237
 */
//TODO: I'm not sure if this is a completely safe (in terms of how much it interferes with Flatlist's ability)
//to optimize, but the warnings leave, so that's a start. More investigation is warranted
export default class DummyVirtualizedView extends React.PureComponent<FlatListProps<unknown>> {

  render(): React.ReactElement {
    const {children, ...otherProps} = this.props
    return (
      <FlatList
        nestedScrollEnabled
        data={[]}
        ListEmptyComponent={null}
        keyExtractor={() => "dummy"}
        renderItem={null}
        ListHeaderComponent={
          <React.Fragment>{children}</React.Fragment>
        }
        {...otherProps}
      />
    );
  }

}