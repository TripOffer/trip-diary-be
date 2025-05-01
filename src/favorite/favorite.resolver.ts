import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { FavoriteService } from './favorite.service';
import { Favorite } from './entities/favorite.entity';
import { CreateFavoriteInput } from './dto/create-favorite.input';
import { UpdateFavoriteInput } from './dto/update-favorite.input';

@Resolver(() => Favorite)
export class FavoriteResolver {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Mutation(() => Favorite)
  createFavorite(@Args('createFavoriteInput') createFavoriteInput: CreateFavoriteInput) {
    return this.favoriteService.create(createFavoriteInput);
  }

  @Query(() => [Favorite], { name: 'favorite' })
  findAll() {
    return this.favoriteService.findAll();
  }

  @Query(() => Favorite, { name: 'favorite' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.favoriteService.findOne(id);
  }

  @Mutation(() => Favorite)
  updateFavorite(@Args('updateFavoriteInput') updateFavoriteInput: UpdateFavoriteInput) {
    return this.favoriteService.update(updateFavoriteInput.id, updateFavoriteInput);
  }

  @Mutation(() => Favorite)
  removeFavorite(@Args('id', { type: () => Int }) id: number) {
    return this.favoriteService.remove(id);
  }
}
